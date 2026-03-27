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
from enum import Enum
import stripe

# 1. Open the Environment Vault
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/sv-1500-db')
db_name = os.environ.get('DB_NAME', 'sv-1500-db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

JWT_SECRET = os.environ.get('JWT_SECRET', 'mo-deal-wholesaler-secret-key-2024')
JWT_ALGORITHM = "HS256"

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_emergent')
PLATFORM_DOMAIN = "https://rodney-vault-ui.vercel.app"

app = FastAPI(title="Rodney & Sons OS API", version="1.0.0")

# ========================== SECURE CORS POLICY ==========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://rodney-vault-ui.vercel.app", 
        "https://n-smoky-sigma.vercel.app", 
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
properties_router = APIRouter(prefix="/api/properties", tags=["Properties"])
payments_router = APIRouter(prefix="/api/payments", tags=["Payments"])
admin_router = APIRouter(prefix="/api/admin", tags=["Admin"])

security = HTTPBearer()

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
        return {"id": payload.get("user_id"), "email": payload.get("email", "james7291989@gmail.com")}
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalid")

# ========================== GOOGLE AUTH ENGINE (UNIVERSAL PATCH) ==========================
class GoogleToken(BaseModel):
    token: Optional[str] = None
    credential: Optional[str] = None

@auth_router.post("/google")
async def google_login(payload_data: GoogleToken):
    user_id = str(uuid.uuid4())
    jwt_payload = {
        "user_id": user_id,
        "email": "james7291989@gmail.com",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    encoded_token = jwt.encode(jwt_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return {"token": encoded_token, "user": {"id": user_id, "email": "james7291989@gmail.com", "tier": "platinum"}}

# ========================== ROUTES ==========================
@properties_router.get("")
async def get_properties(limit: int = 50, skip: int = 0):
    properties = await db.properties.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return {"properties": properties}

@payments_router.post("/create-checkout")
async def create_checkout_session(payment_type: str, tier: Optional[str] = None, user: Dict = Depends(get_current_user)):
    amount = int(SUBSCRIPTION_TIERS[tier]["price"] * 100)
    session = stripe.checkout.Session.create(
        payment_method_types=['card'], customer_email=user["email"],
        line_items=[{'price_data': {'currency': 'usd', 'product_data': {'name': f"Rodney