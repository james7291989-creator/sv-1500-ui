import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Dict
import jwt
import stripe
import certifi

# 1. Environment Vault
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', "mongodb+srv://james7291989_db_user:Imaking1.@rodneyvault.oyhly2g.mongodb.net/?retryWrites=true&w=majority&appName=RodneyVault")
db_name = os.environ.get('DB_NAME', "modeal")

client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
db = client[db_name]

JWT_SECRET = os.environ.get('JWT_SECRET', 'mo-deal-wholesaler-production-secret-2026')
JWT_ALGORITHM = "HS256"
stripe.api_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
PLATFORM_DOMAIN = "https://rodney-vault-ui.vercel.app"

app = FastAPI(title="Rodney & Sons OS API")
security = HTTPBearer()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for production lock pipeline testing
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"],
)

deals_router = APIRouter(prefix="/api/deals", tags=["Deals"])

# --- AUTH VERIFICATION ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload.get("user_id")})
        if not user:
            # Fallback for dev/testing CEO
            return {"id": "ceo-override", "email": "james7291989@gmail.com", "tier": "platinum"}
        return {"id": user["id"], "email": user["email"]}
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalid")

# ========================== PRIORITY 1: MONEY MAKER ENDPOINT ==========================
@deals_router.post("/{property_id}/lock")
async def lock_deal(property_id: str, user: Dict = Depends(get_current_user)):
    # 1. Find the property
    property_data = await db.properties.find_one({"id": property_id})
    if not property_data:
        raise HTTPException(status_code=404, detail="Asset not found in Vault.")
    
    if property_data.get("status") == "under_contract":
        raise HTTPException(status_code=400, detail="Asset already locked by another investor.")

    deal_id = str(uuid.uuid4())

    # 2. Create the Stripe Checkout for $5,000 EMD
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card', 'us_bank_account'],
            customer_email=user["email"],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f"EMD Deposit: {property_data['address']}",
                        'description': "Non-refundable Earnest Money Deposit. Assignment Fee: $7,500."
                    },
                    'unit_amount': 500000, # $5,000 in cents
                },
                'quantity': 1,
            }],
            mode='payment',
            metadata={
                "deal_id": deal_id,
                "property_id": property_id,
                "investor_email": user["email"],
                "type": "emd_lock"
            },
            success_url=f'{PLATFORM_DOMAIN}/contracts?session_id={{CHECKOUT_SESSION_ID}}&deal={deal_id}',
            cancel_url=f'{PLATFORM_DOMAIN}/available-deals'
        )

        # 3. Secure the database records (Pending Payment)
        await db.properties.update_one(
            {"id": property_id},
            {"$set": {"status": "pending_escrow", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )

        deal_record = {
            "id": deal_id,
            "property_id": property_id,
            "investor_email": user["email"],
            "emd_collected": False,
            "rodney_fee": 7500,
            "status": "awaiting_emd",
            "stripe_session_id": session.id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.deals.insert_one(deal_record)

        escrow_record = {
            "id": str(uuid.uuid4()),
            "deal_id": deal_id,
            "provider": "Missouri Title Loans",
            "rodney_cut": 7500,
            "status": "pending_funds",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.escrows.insert_one(escrow_record)

        # 4. Trigger DocuSign Generation (Simulated Engine Call)
        # In production, Stripe Webhook listening for 'checkout.session.completed' fires the actual DocuSign API payload
        print(f"📄 DOCUSIGN ENGINE QUEUED: Assignment Contract for {user['email']} on {property_data['address']}")

        return {"checkout_url": session.url, "deal_id": deal_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe Engine Failure: {str(e)}")

app.include_router(deals_router)