import os
import logging
from pathlib import Path
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header, BackgroundTasks
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
import json
import stripe
import google.generativeai as genai

# --- NEW GOOGLE AUTH IMPORTS ---
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# 1. Open the Environment Vault
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# 2. Check for Master Key
key_path = os.getenv("PRIVATE_KEY_FILE", "private.pem")
try:
    with open(key_path, "r") as f:
        private_key_contents = f.read()
    print(f"🚀 Server initialized with key: {key_path}")
except FileNotFoundError:
    print(f"⚠️ Warning: Master key {key_path} not found.")

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/sv-1500-db')
db_name = os.environ.get('DB_NAME', 'sv-1500-db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'mo-deal-wholesaler-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# --- GOOGLE CLIENT ID ---
GOOGLE_CLIENT_ID = "783162825648-1nllnud8mm7ibuflli1ttrhpd58oo7c8.apps.googleusercontent.com"

# --- STRIPE & GEMINI CONFIGURATION ---
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_emergent')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
PLATFORM_DOMAIN = "https://n-smoky-sigma.vercel.app"

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    ai_model = genai.GenerativeModel('gemini-2.5-flash')

# Create the main app
app = FastAPI(title="Rodney & Sons OS API", version="1.0.0")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
properties_router = APIRouter(prefix="/api/properties", tags=["Properties"])
contracts_router = APIRouter(prefix="/api/contracts", tags=["Contracts"])
investors_router = APIRouter(prefix="/api/investors", tags=["Investors"])
payments_router = APIRouter(prefix="/api/payments", tags=["Payments"])
outreach_router = APIRouter(prefix="/api/outreach", tags=["Outreach"])
chat_router = APIRouter(prefix="/api/chat", tags=["AI Chat"])
closing_router = APIRouter(prefix="/api/closing", tags=["Closing"])
admin_router = APIRouter(prefix="/api/admin", tags=["Admin"])
integrations_router = APIRouter(prefix="/api/integrations", tags=["External Integrations"])

security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========================== ENUMS ==========================
class InvestorTier(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"

class PropertyStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    UNDER_CONTRACT = "under_contract"
    ASSIGNED = "assigned"
    CLOSED = "closed"
    DEAD = "dead"

class ContractStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    SIGNED = "signed"
    ASSIGNED = "assigned"
    CLOSING = "closing"
    CLOSED = "closed"
    CANCELLED = "cancelled"

class OutreachStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    RESPONDED = "responded"
    FAILED = "failed"

# ========================== MODELS ==========================
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    company_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    tier: InvestorTier = InvestorTier.BRONZE

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleTokenAuth(BaseModel):
    token: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tier: InvestorTier = InvestorTier.BRONZE
    is_admin: bool = False
    is_active: bool = True
    proof_of_funds_verified: bool = False
    proof_of_funds_amount: float = 0
    deals_closed: int = 0
    subscription_status: str = "inactive"
    subscription_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    company_name: Optional[str]
    tier: str
    is_admin: bool
    is_active: bool
    proof_of_funds_verified: bool
    proof_of_funds_amount: float
    deals_closed: int
    subscription_status: str
    created_at: str
    
class PropertyCreate(BaseModel):
    address: str
    city: str
    state: str = "MO"
    zip_code: str
    county: str
    legal_description: Optional[str] = None
    property_type: str = "single_family"
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    sqft: Optional[int] = None
    lot_size: Optional[float] = None
    year_built: Optional[int] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_email: Optional[str] = None
    owner_address: Optional[str] = None
    tax_delinquency_years: float = 0
    tax_delinquency_amount: float = 0
    assessed_value: float = 0
    estimated_arv: float = 0
    estimated_repairs: float = 0
    vacancy_indicators: List[str] = []
    code_violations: List[str] = []
    liens: List[Dict] = []
    photos: List[str] = []
    notes: Optional[str] = None

class Property(PropertyCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    distress_score: int = 0
    status: PropertyStatus = PropertyStatus.NEW
    contracted_price: Optional[float] = None
    investor_price: Optional[float] = None
    assignment_fee: Optional[float] = None
    acquired_by_investor_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContractCreate(BaseModel):
    property_id: str
    contract_type: str  # "purchase" or "assignment"
    seller_name: Optional[str] = None
    seller_email: Optional[str] = None
    seller_phone: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_id: Optional[str] = None
    purchase_price: float
    earnest_money_deposit: float = 500
    inspection_days: int = 10
    closing_days: int = 30
    special_terms: Optional[str] = None

class Contract(ContractCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: ContractStatus = ContractStatus.DRAFT
    assignment_fee: float = 0
    coordination_fee: float = 795
    expedited_fee: float = 0
    docusign_envelope_id: Optional[str] = None
    seller_signed_at: Optional[datetime] = None
    buyer_signed_at: Optional[datetime] = None
    notarized_at: Optional[datetime] = None
    closing_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OutreachCreate(BaseModel):
    property_id: str
    channel: str  
    message_template: str
    scheduled_at: Optional[datetime] = None

class Outreach(OutreachCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: OutreachStatus = OutreachStatus.PENDING
    sent_at: Optional[datetime] = None
    response: Optional[str] = None
    twilio_sid: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    email: Optional[str] = None
    transaction_type: str 
    amount: float
    currency: str = "usd"
    session_id: str
    payment_status: str = "pending"
    metadata: Dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  
    content: str
    property_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    property_id: Optional[str] = None
    context_type: str = "general"

SUBSCRIPTION_TIERS = {
    "bronze": {"price": 97.00, "name": "Bronze", "features": ["Email alerts", "24hr delayed deals", "Basic property info"]},
    "silver": {"price": 297.00, "name": "Silver", "features": ["Real-time alerts", "Instant access", "Full due diligence packets", "Comp reports"]},
    "gold": {"price": 597.00, "name": "Gold", "features": ["30-min early access", "Direct seller contact", "Dedicated support"]},
    "platinum": {"price": 1497.00, "name": "Platinum", "features": ["Exclusive pocket listings", "Bulk pricing", "Deal guarantee"]}
}

# ========================== AUTH HELPERS ==========================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, is_admin: bool = False) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(user: Dict = Depends(get_current_user)) -> Dict:
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ========================== DISTRESS SCORE CALCULATOR ==========================
def calculate_distress_score(property_data: Dict) -> int:
    score = 0
    tax_years = property_data.get("tax_delinquency_years", 0)
    if tax_years >= 3:
        score += 20
    elif tax_years >= 2:
        score += 15
    elif tax_years >= 1:
        score += 10
    
    vacancy = len(property_data.get("vacancy_indicators", []))
    score += min(vacancy * 5, 15)
    
    violations = len(property_data.get("code_violations", []))
    score += min(violations * 5, 15)
    
    owner_address = property_data.get("owner_address", "")
    if owner_address and property_data.get("state", "MO") not in owner_address:
        score += 15
    elif property_data.get("notes") and any(w in property_data.get("notes", "").lower() for w in ["estate", "probate", "deceased", "divorce"]):
        score += 15
    
    liens = len(property_data.get("liens", []))
    score += min(liens * 5, 15)
    
    if property_data.get("estimated_repairs", 0) > 50000:
        score += 20
    elif property_data.get("estimated_repairs", 0) > 25000:
        score += 15
    elif property_data.get("estimated_repairs", 0) > 10000:
        score += 10
    
    return min(score, 100)

# ========================== FEE CALCULATOR ==========================
def calculate_fees(contracted_price: float, investor_price: float, expedited: bool = False) -> Dict:
    spread = investor_price - contracted_price
    percentage_fee = investor_price * 0.15
    flat_fee = 10000
    
    assignment_fee = max(flat_fee, percentage_fee, 5000)
    coordination_fee = 795
    expedited_fee = 1500 if expedited else 0
    
    total_fees = assignment_fee + coordination_fee + expedited_fee
    
    return {
        "assignment_fee": assignment_fee,
        "coordination_fee": coordination_fee,
        "expedited_fee": expedited_fee,
        "total_fees": total_fees
    }

# ========================== AUTH ROUTES ==========================
@auth_router.post("/google")
async def google_auth(request: GoogleTokenAuth):
    try:
        idinfo = id_token.verify_oauth2_token(
            request.token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        
        email = idinfo.get('email')
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')

        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")

        user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if not user:
            new_user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                tier=InvestorTier.BRONZE
            )
            
            user_dict = new_user.model_dump()
            user_dict["password_hash"] = hash_password(str(uuid.uuid4())) 
            user_dict["created_at"] = user_dict["created_at"].isoformat()
            user_dict["updated_at"] = user_dict["updated_at"].isoformat()
            
            await db.users.insert_one(user_dict)
            user = user_dict
            
        token = create_token(user["id"], user["email"], user.get("is_admin", False))
        user.pop("password_hash", None)
        
        return {"token": token, "user": user}

    except ValueError as e:
        logger.error(f"Google Auth Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Google token")

@auth_router.post("/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        company_name=user_data.company_name,
        tier=user_data.tier
    )
    
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    token = create_token(user.id, user.email, user.is_admin)
    
    return {"token": token, "user": UserResponse(**{**user_dict, "created_at": user_dict["created_at"]})}

@auth_router.post("/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], user.get("is_admin", False))
    user.pop("password_hash", None)
    
    return {"token": token, "user": user}

@auth_router.get("/me")
async def get_me(user: Dict = Depends(get_current_user)):
    return user

@auth_router.put("/profile")
async def update_profile(updates: Dict, user: Dict = Depends(get_current_user)):
    allowed_fields = ["first_name", "last_name", "phone", "company_name"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    return {"message": "Profile updated"}

# ========================== PROPERTY ROUTES ==========================
@properties_router.post("")
async def create_property(property_data: PropertyCreate, user: Dict = Depends(get_admin_user)):
    prop = Property(**property_data.model_dump())
    prop.distress_score = calculate_distress_score(property_data.model_dump())
    
    prop_dict = prop.model_dump()
    prop_dict["created_at"] = prop_dict["created_at"].isoformat()
    prop_dict["updated_at"] = prop_dict["updated_at"].isoformat()
    
    await db.properties.insert_one(prop_dict)
    return prop_dict

@properties_router.get("")
async def get_properties(
    status: Optional[str] = None,
    min_score: int = 0,
    city: Optional[str] = None,
    county: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    user: Dict = Depends(get_current_user)
):
    query = {"distress_score": {"$gte": min_score}}
    if status:
        query["status"] = status
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if county:
        query["county"] = {"$regex": county, "$options": "i"}
    
    tier = user.get("tier", "bronze")
    if tier == "bronze":
        query["status"] = {"$in": [PropertyStatus.NEW.value, PropertyStatus.CONTACTED.value]}
    
    properties = await db.properties.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.properties.count_documents(query)
    
    return {"properties": properties, "total": total, "limit": limit, "skip": skip}

@properties_router.get("/{property_id}")
async def get_property(property_id: str, user: Dict = Depends(get_current_user)):
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop

@properties_router.put("/{property_id}")
async def update_property(property_id: str, updates: Dict, user: Dict = Depends(get_admin_user)):
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "distress_score" not in updates:
        prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
        if prop:
            merged = {**prop, **updates}
            updates["distress_score"] = calculate_distress_score(merged)
    
    await db.properties.update_one({"id": property_id}, {"$set": updates})
    return {"message": "Property updated"}

@properties_router.delete("/{property_id}")
async def delete_property(property_id: str, user: Dict = Depends(get_admin_user)):
    result = await db.properties.delete_one({"id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted"}

# ========================== CONTRACT ROUTES ==========================
@contracts_router.post("")
async def create_contract(contract_data: ContractCreate, user: Dict = Depends(get_current_user)):
    prop = await db.properties.find_one({"id": contract_data.property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    contract = Contract(**contract_data.model_dump())
    
    if contract_data.contract_type == "assignment":
        fees = calculate_fees(
            prop.get("contracted_price", contract_data.purchase_price),
            contract_data.purchase_price
        )
        contract.assignment_fee = fees["assignment_fee"]
        contract.coordination_fee = fees["coordination_fee"]
    
    contract_dict = contract.model_dump()
    contract_dict["created_at"] = contract_dict["created_at"].isoformat()
    contract_dict["updated_at"] = contract_dict["updated_at"].isoformat()
    
    await db.contracts.insert_one(contract_dict)
    return contract_dict

@contracts_router.get("")
async def get_contracts(
    status: Optional[str] = None,
    property_id: Optional[str] = None,
    user: Dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if property_id:
        query["property_id"] = property_id
    
    if not user.get("is_admin"):
        query["$or"] = [{"buyer_id": user["id"]}, {"buyer_email": user["email"]}]
    
    contracts = await db.contracts.find(query, {"_id": 0}).to_list(100)
    return {"contracts": contracts}

@contracts_router.get("/{contract_id}")
async def get_contract(contract_id: str, user: Dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

@contracts_router.post("/{contract_id}/send-for-signature")
async def send_for_signature(contract_id: str, user: Dict = Depends(get_admin_user)):
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    docusign_key = os.environ.get('CLIENT_ID')
    
    if not docusign_key:
        return {
            "message": "DocuSign integration pending - CLIENT_ID required",
            "status": "pending_integration",
            "instructions": "Please provide your DocuSign CLIENT_ID to enable e-signatures"
        }
    
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {"status": ContractStatus.SENT.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Contract sent for signature", "contract_id": contract_id}

# ========================== INVESTOR ROUTES ==========================
@investors_router.get("/deals")
async def get_available_deals(user: Dict = Depends(get_current_user)):
    tier = user.get("tier", "bronze")
    query = {"status": {"$in": [PropertyStatus.UNDER_CONTRACT.value]}}
    
    tier_priority = {"bronze": 1, "silver": 2, "gold": 3, "platinum": 4}
    user_priority = tier_priority.get(tier, 1)
    
    properties = await db.properties.find(query, {"_id": 0}).to_list(50)
    
    deals = []
    for prop in properties:
        deal = {
            "property_id": prop["id"],
            "address": prop["address"],
            "city": prop["city"],
            "county": prop["county"],
            "distress_score": prop["distress_score"],
            "investor_price": prop.get("investor_price"),
            "estimated_arv": prop.get("estimated_arv"),
            "estimated_repairs": prop.get("estimated_repairs"),
            "property_type": prop.get("property_type"),
            "bedrooms": prop.get("bedrooms"),
            "bathrooms": prop.get("bathrooms"),
            "sqft": prop.get("sqft"),
            "photos": prop.get("photos", [])[:1] if tier == "bronze" else prop.get("photos", []),
        }
        
        if user_priority >= 2:
            deal["full_due_diligence"] = True
            deal["owner_motivation"] = prop.get("notes")
        if user_priority >= 3:
            deal["seller_contact_available"] = True
        if user_priority >= 4:
            deal["pocket_listing"] = True
            deal["negotiable_pricing"] = True
        
        deals.append(deal)
    
    return {"deals": deals, "tier": tier, "total": len(deals)}

@investors_router.post("/deals/{property_id}/lock")
async def lock_deal(property_id: str, user: Dict = Depends(get_current_user)):
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if prop.get("acquired_by_investor_id"):
        raise HTTPException(status_code=400, detail="Deal already locked by another investor")
    
    investor_price = prop.get("investor_price", 0)
    fees = calculate_fees(prop.get("contracted_price", 0), investor_price)
    
    return {
        "property_id": property_id,
        "investor_price": investor_price,
        "required_emd": 5000, # Hardcoded $5k Reservation Fee
        "assignment_fee": fees["assignment_fee"],
        "coordination_fee": fees["coordination_fee"],
        "total_fees": fees["total_fees"],
        "next_step": "Submit $5,000 reservation fee to lock this deal"
    }

@investors_router.get("/subscription-tiers")
async def get_subscription_tiers():
    return {"tiers": SUBSCRIPTION_TIERS}

# ========================== NATIVE STRIPE PAYMENTS ($5k EMD PIPELINE) ==========================
@payments_router.post("/create-checkout")
async def create_checkout_session(
    payment_type: str,  
    tier: Optional[str] = None,
    property_id: Optional[str] = None,
    user: Dict = Depends(get_current_user)
):
    try:
        if payment_type == "subscription":
            if not tier or tier not in SUBSCRIPTION_TIERS:
                raise HTTPException(status_code=400, detail="Invalid subscription tier")
            amount = int(SUBSCRIPTION_TIERS[tier]["price"] * 100)
            product_name = f"Rodney & Sons - {tier.title()} Tier"
            metadata = {"type": "subscription", "tier": tier, "user_id": user["id"]}
            
        elif payment_type == "emd":
            if not property_id:
                raise HTTPException(status_code=400, detail="Property ID required")
            
            # The 5K Tollbooth
            amount = 500000  # Exactly $5,000.00 Reservation Fee
            product_name = f"Assignment Reservation Fee - Property ID: {property_id}"
            metadata = {"type": "emd", "property_id": property_id, "user_id": user["id"], "buyer_email": user["email"]}
        else:
            raise HTTPException(status_code=400, detail="Invalid payment type")
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            customer_email=user["email"],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': product_name},
                    'unit_amount': amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            metadata=metadata,
            success_url=f'{PLATFORM_DOMAIN}/payment-success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{PLATFORM_DOMAIN}/payment-cancelled',
        )
        
        transaction = PaymentTransaction(
            user_id=user["id"],
            email=user["email"],
            transaction_type=payment_type,
            amount=amount / 100,
            session_id=session.id,
            payment_status="pending",
            metadata=metadata
        )
        
        tx_dict = transaction.model_dump()
        tx_dict["created_at"] = tx_dict["created_at"].isoformat()
        tx_dict["updated_at"] = tx_dict["updated_at"].isoformat()
        await db.payment_transactions.insert_one(tx_dict)
        
        return {"checkout_url": session.url, "session_id": session.id}
        
    except Exception as e:
        logger.error(f"Payment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        session_id = session.get('id')
        metadata = session.get('metadata', {})
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if metadata.get("type") == "emd":
            property_id = metadata.get("property_id")
            buyer_email = metadata.get("buyer_email")
            
            # Lock the property
            await db.properties.update_one(
                {"id": property_id},
                {"$set": {
                    "acquired_by_investor_id": metadata.get("user_id"),
                    "status": PropertyStatus.ASSIGNED.value,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            print(f"💰 $5k CAPTURED FOR {property_id}. TRIGGERING DOCUSIGN TO {buyer_email}...")
            
    return {"status": "success"}

# ========================== GEMINI AI CHAT ROUTE ==========================
@chat_router.post("")
async def chat_endpoint(request: ChatRequest, user: Dict = Depends(get_current_user)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini AI is not armed in the environment.")
    try:
        response = ai_model.generate_content(request.message)
        return {"reply": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== INTEGRATION STATUS ==========================
@api_router.get("/integration-status")
async def get_integration_status():
    docusign_configured = bool(os.environ.get('CLIENT_ID'))
    return {
        "stripe": {
            "configured": bool(os.environ.get('STRIPE_SECRET_KEY')),
            "status": "active" if os.environ.get('STRIPE_SECRET_KEY') else "pending"
        },
        "gemini": {
            "configured": bool(os.environ.get('GEMINI_API_KEY')),
            "status": "active" if os.environ.get('GEMINI_API_KEY') else "pending"
        },
        "docusign": {
            "configured": docusign_configured,
            "status": "active" if docusign_configured else "pending",
            "instructions": "DocuSign Engine is Online and Authorized" if docusign_configured else "Provide CLIENT_ID for e-signatures"
        }
    }

# Include all routers
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(properties_router)
app.include_router(contracts_router)
app.include_router(investors_router)
app.include_router(payments_router)
app.include_router(outreach_router)
app.include_router(chat_router)
app.include_router(closing_router)
app.include_router(admin_router)
app.include_router(integrations_router)

# Updated CORS configuration for Production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://rodneyandsonsenterprise-9kq2hc5l1-james-arms-projects.vercel.app",
        "https://n-smoky-sigma.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()