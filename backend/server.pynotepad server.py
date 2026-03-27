import os
import logging
from pathlib import Path
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
import stripe
import google.generativeai as genai

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# 1. Open the Environment Vault
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/sv-1500-db')
db_name = os.environ.get('DB_NAME', 'sv-1500-db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'mo-deal-wholesaler-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# --- STRIPE & GEMINI CONFIGURATION ---
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_emergent')
PLATFORM_DOMAIN = "https://n-smoky-sigma.vercel.app"

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    ai_model = genai.GenerativeModel('gemini-2.5-flash')

app = FastAPI(title="Rodney & Sons OS API", version="1.0.0")

api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
properties_router = APIRouter(prefix="/api/properties", tags=["Properties"])
payments_router = APIRouter(prefix="/api/payments", tags=["Payments"])
admin_router = APIRouter(prefix="/api/admin", tags=["Admin"])
chat_router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

security = HTTPBearer()

class InvestorTier(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"

class PropertyStatus(str, Enum):
    NEW = "new"
    UNDER_CONTRACT = "under_contract"

class PropertyCreate(BaseModel):
    address: str
    city: str
    state: str = "MO"
    zip_code: str
    county: str
    property_type: str = "single_family"
    tax_delinquency_years: float = 0
    tax_delinquency_amount: float = 0
    assessed_value: float = 0
    estimated_arv: float = 0
    distress_score: int = 0
    notes: Optional[str] = None

class Property(PropertyCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: PropertyStatus = PropertyStatus.NEW
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

SUBSCRIPTION_TIERS = {
    "bronze": {"price": 97.00, "name": "Bronze"},
    "silver": {"price": 297.00, "name": "Silver"},
    "gold": {"price": 597.00, "name": "Gold"},
    "platinum": {"price": 1497.00, "name": "Platinum"}
}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password_hash": 0})
        if not user: raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalid")

# ========================== PUBLIC PROPERTY ROUTE ==========================
@properties_router.get("")
async def get_properties(limit: int = 50, skip: int = 0):
    # This makes the data public so the Paywall works for logged-out visitors
    properties = await db.properties.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return {"properties": properties}

# ========================== 1-CLICK DATA INJECTOR ==========================
@admin_router.get("/force-seed")
async def force_seed():
    trustee_properties = [
        {
            "address": "LOCKED FOR NON-PLATINUM", "city": "St. Louis", "state": "MO", "zip_code": "63115",
            "county": "St. Louis City", "property_type": "single_family", "tax_delinquency_years": 4,
            "tax_delinquency_amount": 12450.00, "assessed_value": 45000, "estimated_arv": 115000, "distress_score": 95,
            "notes": "COUNTY TRUSTEE LIST: Post-3rd Sale. Vacant. Code violations present."
        },
        {
            "address": "LOCKED FOR NON-PLATINUM", "city": "Kansas City", "state": "MO", "zip_code": "64128",
            "county": "Jackson", "property_type": "single_family", "tax_delinquency_years": 3,
            "tax_delinquency_amount": 8900.00, "assessed_value": 62000, "estimated_arv": 140000, "distress_score": 88,
            "notes": "COUNTY TRUSTEE LIST: Overgrown lot, structural damage reported."
        },
        {
            "address": "LOCKED FOR NON-PLATINUM", "city": "Springfield", "state": "MO", "zip_code": "65803",
            "county": "Greene", "property_type": "single_family", "tax_delinquency_years": 5,
            "tax_delinquency_amount": 15200.00, "assessed_value": 38000, "estimated_arv": 105000, "distress_score": 99,
            "notes": "COUNTY TRUSTEE LIST: Extreme distress. Immediate title acquisition possible via county OTC."
        }
    ]
    count = 0
    for prop in trustee_properties:
        p = Property(**prop)
        p_dict = p.model_dump()
        p_dict["created_at"] = p_dict["created_at"].isoformat()
        p_dict["updated_at"] = p_dict["updated_at"].isoformat()
        await db.properties.insert_one(p_dict)
        count += 1
    return {"status": "SUCCESS", "message": f"Injected {count} assets into LIVE database."}

# ========================== STRIPE SUBSCRIPTION CHECKOUT ==========================
@payments_router.post("/create-checkout")
async def create_checkout_session(payment_type: str, tier: Optional[str] = None, user: Dict = Depends(get_current_user)):
    try:
        if payment_type == "subscription":
            amount = int(SUBSCRIPTION_TIERS[tier]["price"] * 100)
            product_name = f"Rodney & Sons - {tier.title()} Data Access"
            metadata = {"type": "subscription", "tier": tier, "user_id": user["id"]}
        else:
            raise HTTPException(status_code=400, detail="Invalid payment type")
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'], customer_email=user["email"],
            line_items=[{'price_data': {'currency': 'usd', 'product_data': {'name': product_name}, 'unit_amount': amount}, 'quantity': 1}],
            mode='payment', metadata=metadata,
            success_url=f'{PLATFORM_DOMAIN}/payment-success?session_id={{CHECKOUT_SESSION_ID}}', cancel_url=f'{PLATFORM_DOMAIN}'
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    message: str

@chat_router.post("")
async def chat_endpoint(request: ChatRequest):
    if not GEMINI_API_KEY: raise HTTPException(status_code=500, detail="Gemini offline")
    return {"reply": ai_model.generate_content(request.message).text}

app.include_router(api_router)
app.include_router(auth_router)
app.include_router(properties_router)
app.include_router(payments_router)
app.include_router(admin_router)
app.include_router(chat_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)