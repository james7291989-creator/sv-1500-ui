from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'mo-deal-wholesaler-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app
app = FastAPI(title="MO Deal Wholesaler API", version="1.0.0")

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
# User Models
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
    
# Property Models
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

# Contract Models
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

# Outreach Models
class OutreachCreate(BaseModel):
    property_id: str
    channel: str  # "sms", "voice", "email", "mail"
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

# Payment Models
class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    email: Optional[str] = None
    transaction_type: str  # "subscription", "emd", "assignment_fee"
    amount: float
    currency: str = "usd"
    session_id: str
    payment_status: str = "pending"
    metadata: Dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Chat Models
class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # "user" or "assistant"
    content: str
    property_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    property_id: Optional[str] = None
    context_type: str = "general"  # "seller_qualification", "property_analysis", "offer_generation"

# Subscription Tiers
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
    
    # Tax delinquency (20%)
    tax_years = property_data.get("tax_delinquency_years", 0)
    if tax_years >= 3:
        score += 20
    elif tax_years >= 2:
        score += 15
    elif tax_years >= 1:
        score += 10
    
    # Vacancy indicators (15%)
    vacancy = len(property_data.get("vacancy_indicators", []))
    score += min(vacancy * 5, 15)
    
    # Code violations (15%)
    violations = len(property_data.get("code_violations", []))
    score += min(violations * 5, 15)
    
    # Owner situation (15%)
    owner_address = property_data.get("owner_address", "")
    if owner_address and property_data.get("state", "MO") not in owner_address:
        score += 15  # Out of state owner
    elif property_data.get("notes") and any(w in property_data.get("notes", "").lower() for w in ["estate", "probate", "deceased", "divorce"]):
        score += 15
    
    # Liens and judgments (15%)
    liens = len(property_data.get("liens", []))
    score += min(liens * 5, 15)
    
    # Physical condition estimate (20%)
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
    
    assignment_fee = max(flat_fee, percentage_fee, 5000)  # Minimum $5000
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
    
    # Tier-based access control
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

@properties_router.post("/{property_id}/analyze")
async def analyze_property(property_id: str, user: Dict = Depends(get_current_user)):
    """AI-powered property analysis using GPT-5.2"""
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"property-analysis-{property_id}",
            system_message="""You are an expert real estate wholesaling analyst in Missouri. 
            Analyze distressed properties and provide detailed investment analysis including:
            - ARV estimation rationale
            - Repair cost breakdown
            - Comparable sales analysis
            - Risk factors
            - Recommended offer price (70% rule)
            - Exit strategy recommendations (flip, BRRRR, wholesale)
            Be specific with numbers and actionable insights."""
        ).with_model("openai", "gpt-5.2")
        
        analysis_prompt = f"""Analyze this Missouri distressed property:
        
Address: {prop.get('address')}, {prop.get('city')}, {prop.get('state')} {prop.get('zip_code')}
County: {prop.get('county')}
Property Type: {prop.get('property_type')}
Beds/Baths: {prop.get('bedrooms')}/{prop.get('bathrooms')}
Sqft: {prop.get('sqft')}
Year Built: {prop.get('year_built')}
Lot Size: {prop.get('lot_size')} acres

Distress Indicators:
- Tax Delinquency: {prop.get('tax_delinquency_years')} years (${prop.get('tax_delinquency_amount')})
- Assessed Value: ${prop.get('assessed_value')}
- Code Violations: {', '.join(prop.get('code_violations', [])) or 'None reported'}
- Vacancy Indicators: {', '.join(prop.get('vacancy_indicators', [])) or 'None'}
- Liens: {len(prop.get('liens', []))} liens on record

Current Estimates:
- Estimated ARV: ${prop.get('estimated_arv')}
- Estimated Repairs: ${prop.get('estimated_repairs')}
- DistressScore: {prop.get('distress_score')}/100

Notes: {prop.get('notes', 'None')}

Provide a comprehensive investment analysis with specific recommendations."""
        
        response = await chat.send_message(UserMessage(text=analysis_prompt))
        
        return {
            "property_id": property_id,
            "analysis": response,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    except ImportError:
        raise HTTPException(status_code=500, detail="AI integration not available")
    except Exception as e:
        logger.error(f"AI analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# ========================== CONTRACT ROUTES ==========================
@contracts_router.post("")
async def create_contract(contract_data: ContractCreate, user: Dict = Depends(get_current_user)):
    # Verify property exists
    prop = await db.properties.find_one({"id": contract_data.property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    contract = Contract(**contract_data.model_dump())
    
    # Calculate fees for assignment contracts
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
    
    # Non-admin users only see their own contracts or contracts where they're the buyer
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

@contracts_router.put("/{contract_id}/status")
async def update_contract_status(contract_id: str, status: str, user: Dict = Depends(get_admin_user)):
    valid_statuses = [s.value for s in ContractStatus]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Contract status updated"}

@contracts_router.post("/{contract_id}/send-for-signature")
async def send_for_signature(contract_id: str, user: Dict = Depends(get_admin_user)):
    """Send contract for e-signature via DocuSign (requires API key)"""
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check for DocuSign configuration
    docusign_key = os.environ.get('DOCUSIGN_API_KEY')
    if not docusign_key:
        return {
            "message": "DocuSign integration pending - API key required",
            "status": "pending_integration",
            "instructions": "Please provide DocuSign API credentials to enable e-signatures"
        }
    
    # TODO: Implement DocuSign integration when key is provided
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {"status": ContractStatus.SENT.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Contract sent for signature", "contract_id": contract_id}

# ========================== INVESTOR ROUTES ==========================
@investors_router.get("/deals")
async def get_available_deals(user: Dict = Depends(get_current_user)):
    """Get deals available to the investor based on their tier"""
    tier = user.get("tier", "bronze")
    query = {"status": {"$in": [PropertyStatus.UNDER_CONTRACT.value]}}
    
    # Tier-based filtering
    tier_priority = {"bronze": 1, "silver": 2, "gold": 3, "platinum": 4}
    user_priority = tier_priority.get(tier, 1)
    
    properties = await db.properties.find(query, {"_id": 0}).to_list(50)
    
    # Format as deal cards
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
        
        # Higher tiers get more info
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
    """Lock a deal with EMD - first qualified investor wins"""
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if prop.get("acquired_by_investor_id"):
        raise HTTPException(status_code=400, detail="Deal already locked by another investor")
    
    # Calculate required EMD
    investor_price = prop.get("investor_price", 0)
    fees = calculate_fees(prop.get("contracted_price", 0), investor_price)
    required_emd = max(fees["assignment_fee"] * 0.5, 2500)
    
    return {
        "property_id": property_id,
        "investor_price": investor_price,
        "required_emd": required_emd,
        "assignment_fee": fees["assignment_fee"],
        "coordination_fee": fees["coordination_fee"],
        "total_fees": fees["total_fees"],
        "next_step": "Submit EMD payment to lock this deal"
    }

@investors_router.get("/subscription-tiers")
async def get_subscription_tiers():
    """Get available subscription tiers and pricing"""
    return {"tiers": SUBSCRIPTION_TIERS}

# ========================== PAYMENT ROUTES ==========================
@payments_router.post("/create-checkout")
async def create_checkout_session(
    request: Request,
    payment_type: str,  # "subscription" or "emd"
    tier: Optional[str] = None,
    property_id: Optional[str] = None,
    user: Dict = Depends(get_current_user)
):
    """Create Stripe checkout session for subscription or EMD"""
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Determine amount based on payment type
        if payment_type == "subscription":
            if not tier or tier not in SUBSCRIPTION_TIERS:
                raise HTTPException(status_code=400, detail="Invalid subscription tier")
            amount = SUBSCRIPTION_TIERS[tier]["price"]
            metadata = {"type": "subscription", "tier": tier, "user_id": user["id"]}
        elif payment_type == "emd":
            if not property_id:
                raise HTTPException(status_code=400, detail="Property ID required for EMD")
            prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
            if not prop:
                raise HTTPException(status_code=404, detail="Property not found")
            
            investor_price = prop.get("investor_price", 0)
            fees = calculate_fees(prop.get("contracted_price", 0), investor_price)
            amount = max(fees["assignment_fee"] * 0.5, 2500)
            metadata = {"type": "emd", "property_id": property_id, "user_id": user["id"]}
        else:
            raise HTTPException(status_code=400, detail="Invalid payment type")
        
        # Get frontend origin from request
        origin = request.headers.get("origin", host_url)
        success_url = f"{origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin}/payment-cancelled"
        
        checkout_request = CheckoutSessionRequest(
            amount=float(amount),
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            user_id=user["id"],
            email=user["email"],
            transaction_type=payment_type,
            amount=float(amount),
            session_id=session.session_id,
            payment_status="pending",
            metadata=metadata
        )
        
        tx_dict = transaction.model_dump()
        tx_dict["created_at"] = tx_dict["created_at"].isoformat()
        tx_dict["updated_at"] = tx_dict["updated_at"].isoformat()
        await db.payment_transactions.insert_one(tx_dict)
        
        return {"checkout_url": session.url, "session_id": session.session_id}
        
    except ImportError:
        raise HTTPException(status_code=500, detail="Payment integration not available")
    except Exception as e:
        logger.error(f"Payment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@payments_router.get("/status/{session_id}")
async def get_payment_status(session_id: str, user: Dict = Depends(get_current_user)):
    """Check payment status and update database"""
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction record
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if transaction and transaction.get("payment_status") != "paid":
            new_status = status.payment_status
            update_data = {
                "payment_status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": update_data}
            )
            
            # Handle successful payment
            if new_status == "paid":
                metadata = transaction.get("metadata", {})
                
                if metadata.get("type") == "subscription":
                    # Activate subscription
                    tier = metadata.get("tier")
                    await db.users.update_one(
                        {"id": transaction["user_id"]},
                        {"$set": {
                            "tier": tier,
                            "subscription_status": "active",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                elif metadata.get("type") == "emd":
                    # Lock the deal
                    property_id = metadata.get("property_id")
                    await db.properties.update_one(
                        {"id": property_id},
                        {"$set": {
                            "acquired_by_investor_id": transaction["user_id"],
                            "status": PropertyStatus.ASSIGNED.value,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
        
        return {
            "session_id": session_id,
            "status": status.status,
            "payment_status": status.payment_status,
            "amount": status.amount_total / 100,  # Convert from cents
            "currency": status.currency
        }
        
    except Exception as e:
        logger.error(f"Payment status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@payments_router.get("/history")
async def get_payment_history(user: Dict = Depends(get_current_user)):
    """Get user's payment history"""
    transactions = await db.payment_transactions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"transactions": transactions}

# ========================== WEBHOOK ROUTE ==========================
@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Webhook received: {webhook_response.event_type}")
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            
            if transaction and transaction.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

# ========================== OUTREACH ROUTES ==========================
@outreach_router.post("/campaigns")
async def create_outreach_campaign(
    property_ids: List[str],
    channel: str,
    message_template: str,
    user: Dict = Depends(get_admin_user)
):
    """Create outreach campaign for multiple properties"""
    campaigns = []
    
    for property_id in property_ids:
        prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
        if not prop:
            continue
        
        outreach = Outreach(
            property_id=property_id,
            channel=channel,
            message_template=message_template
        )
        
        outreach_dict = outreach.model_dump()
        outreach_dict["created_at"] = outreach_dict["created_at"].isoformat()
        
        await db.outreach_campaigns.insert_one(outreach_dict)
        campaigns.append(outreach_dict)
    
    return {"campaigns_created": len(campaigns), "campaigns": campaigns}

@outreach_router.post("/send/{outreach_id}")
async def send_outreach(outreach_id: str, user: Dict = Depends(get_admin_user)):
    """Send outreach message via Twilio"""
    outreach = await db.outreach_campaigns.find_one({"id": outreach_id}, {"_id": 0})
    if not outreach:
        raise HTTPException(status_code=404, detail="Outreach campaign not found")
    
    # Check Twilio configuration
    twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
    
    if not twilio_sid or not twilio_token:
        return {
            "message": "Twilio integration pending - API credentials required",
            "status": "pending_integration",
            "instructions": "Please provide Twilio Account SID and Auth Token to enable SMS/Voice outreach"
        }
    
    # Get property owner contact
    prop = await db.properties.find_one({"id": outreach["property_id"]}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    owner_phone = prop.get("owner_phone")
    if not owner_phone:
        raise HTTPException(status_code=400, detail="Owner phone number not available")
    
    try:
        from twilio.rest import Client
        
        client = Client(twilio_sid, twilio_token)
        twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if outreach["channel"] == "sms":
            message = client.messages.create(
                body=outreach["message_template"].replace("{{address}}", prop.get("address", "")),
                from_=twilio_phone,
                to=owner_phone
            )
            
            await db.outreach_campaigns.update_one(
                {"id": outreach_id},
                {"$set": {
                    "status": OutreachStatus.SENT.value,
                    "sent_at": datetime.now(timezone.utc).isoformat(),
                    "twilio_sid": message.sid
                }}
            )
            
            return {"message": "SMS sent", "sid": message.sid}
        
        return {"message": "Channel not implemented yet"}
        
    except Exception as e:
        logger.error(f"Twilio error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@outreach_router.get("/campaigns")
async def get_outreach_campaigns(user: Dict = Depends(get_admin_user)):
    """Get all outreach campaigns"""
    campaigns = await db.outreach_campaigns.find({}, {"_id": 0}).to_list(100)
    return {"campaigns": campaigns}

# ========================== AI CHAT ROUTES ==========================
@chat_router.post("/message")
async def send_chat_message(chat_req: ChatRequest, user: Dict = Depends(get_current_user)):
    """Send message to AI assistant for seller qualification or property analysis"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        session_id = chat_req.session_id or f"chat-{user['id']}-{str(uuid.uuid4())[:8]}"
        
        # Define system message based on context type
        system_messages = {
            "seller_qualification": """You are a professional real estate acquisitions specialist for MO Deal Wholesaler in Missouri.
            Your role is to qualify motivated sellers and gather information about their property and situation.
            Be friendly but professional. Ask about:
            - Property condition (1-10 scale)
            - Timeline/motivation for selling
            - Ownership situation (sole owner, estate, divorce, etc.)
            - Asking price expectations
            - Property access for inspection
            Always clarify that you are a direct buyer, not a real estate agent.""",
            
            "property_analysis": """You are an expert real estate investment analyst specializing in Missouri wholesale deals.
            Analyze properties for: ARV, repair costs, comparable sales, risk factors, and recommended offer prices.
            Use the 70% rule: MAO = ARV * 0.70 - Repairs - Wholesale Fee
            Be specific with numbers and provide actionable insights.""",
            
            "offer_generation": """You are a deal structuring expert for MO Deal Wholesaler.
            Help generate competitive offer presentations with 3 tiers:
            1. AS-IS CASH: 70% ARV - repairs - margin
            2. EXTENDED CLOSE: 75% ARV - repairs, 45-day close
            3. SELLER FINANCING: 80% ARV, 5% down, 8% interest, 5-year balloon
            Explain benefits of each option to the seller.""",
            
            "general": """You are an AI assistant for MO Deal Wholesaler, a Missouri real estate wholesaling platform.
            Help users with questions about wholesaling, property analysis, deal structuring, and platform features.
            Be knowledgeable about Missouri real estate law, wholesaling best practices, and investment strategies."""
        }
        
        system_message = system_messages.get(chat_req.context_type, system_messages["general"])
        
        # Add property context if available
        if chat_req.property_id:
            prop = await db.properties.find_one({"id": chat_req.property_id}, {"_id": 0})
            if prop:
                system_message += f"\n\nProperty Context:\nAddress: {prop.get('address')}, {prop.get('city')}, MO\nDistressScore: {prop.get('distress_score')}/100\nEstimated ARV: ${prop.get('estimated_arv')}\nEstimated Repairs: ${prop.get('estimated_repairs')}"
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        # Get chat history for context
        history = await db.chat_messages.find(
            {"session_id": session_id},
            {"_id": 0}
        ).sort("created_at", 1).to_list(20)
        
        response = await chat.send_message(UserMessage(text=chat_req.message))
        
        # Store messages
        user_msg = ChatMessage(
            session_id=session_id,
            role="user",
            content=chat_req.message,
            property_id=chat_req.property_id
        )
        assistant_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=response,
            property_id=chat_req.property_id
        )
        
        for msg in [user_msg, assistant_msg]:
            msg_dict = msg.model_dump()
            msg_dict["created_at"] = msg_dict["created_at"].isoformat()
            await db.chat_messages.insert_one(msg_dict)
        
        return {
            "session_id": session_id,
            "response": response,
            "context_type": chat_req.context_type
        }
        
    except ImportError:
        raise HTTPException(status_code=500, detail="AI integration not available")
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@chat_router.get("/history/{session_id}")
async def get_chat_history(session_id: str, user: Dict = Depends(get_current_user)):
    """Get chat history for a session"""
    messages = await db.chat_messages.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    return {"session_id": session_id, "messages": messages}

# ========================== CLOSING ROUTES ==========================
@closing_router.post("/initiate/{contract_id}")
async def initiate_closing(contract_id: str, user: Dict = Depends(get_admin_user)):
    """Initiate closing process with title company"""
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    prop = await db.properties.find_one({"id": contract["property_id"]}, {"_id": 0})
    
    # Create closing record
    closing = {
        "id": str(uuid.uuid4()),
        "contract_id": contract_id,
        "property_id": contract["property_id"],
        "status": "initiated",
        "title_company": None,
        "escrow_officer": None,
        "title_search_ordered": False,
        "title_search_complete": False,
        "closing_scheduled": False,
        "closing_date": None,
        "funds_received": False,
        "deed_recorded": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.closing_transactions.insert_one(closing)
    
    return {
        "closing_id": closing["id"],
        "status": "initiated",
        "next_steps": [
            "Select title company",
            "Order title search",
            "Schedule closing date",
            "Coordinate fund transfers"
        ]
    }

@closing_router.put("/{closing_id}")
async def update_closing(closing_id: str, updates: Dict, user: Dict = Depends(get_admin_user)):
    """Update closing transaction"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.closing_transactions.update_one({"id": closing_id}, {"$set": updates})
    return {"message": "Closing updated"}

@closing_router.get("")
async def get_closings(user: Dict = Depends(get_admin_user)):
    """Get all closing transactions"""
    closings = await db.closing_transactions.find({}, {"_id": 0}).to_list(100)
    return {"closings": closings}

# ========================== ADMIN ROUTES ==========================
@admin_router.get("/dashboard")
async def get_admin_dashboard(user: Dict = Depends(get_admin_user)):
    """Get admin dashboard statistics"""
    # Pipeline stats
    total_properties = await db.properties.count_documents({})
    properties_by_status = {}
    for status in PropertyStatus:
        count = await db.properties.count_documents({"status": status.value})
        properties_by_status[status.value] = count
    
    # Revenue stats
    paid_transactions = await db.payment_transactions.find(
        {"payment_status": "paid"},
        {"_id": 0}
    ).to_list(1000)
    
    total_revenue = sum(t.get("amount", 0) for t in paid_transactions)
    subscription_revenue = sum(t.get("amount", 0) for t in paid_transactions if t.get("metadata", {}).get("type") == "subscription")
    emd_collected = sum(t.get("amount", 0) for t in paid_transactions if t.get("metadata", {}).get("type") == "emd")
    
    # User stats
    total_investors = await db.users.count_documents({"is_admin": False})
    active_subscribers = await db.users.count_documents({"subscription_status": "active"})
    
    investors_by_tier = {}
    for tier in InvestorTier:
        count = await db.users.count_documents({"tier": tier.value, "is_admin": False})
        investors_by_tier[tier.value] = count
    
    # Contract stats
    total_contracts = await db.contracts.count_documents({})
    closed_contracts = await db.contracts.count_documents({"status": ContractStatus.CLOSED.value})
    
    return {
        "properties": {
            "total": total_properties,
            "by_status": properties_by_status
        },
        "revenue": {
            "total": total_revenue,
            "subscriptions": subscription_revenue,
            "emd_collected": emd_collected
        },
        "investors": {
            "total": total_investors,
            "active_subscribers": active_subscribers,
            "by_tier": investors_by_tier
        },
        "contracts": {
            "total": total_contracts,
            "closed": closed_contracts
        }
    }

@admin_router.get("/users")
async def get_all_users(user: Dict = Depends(get_admin_user)):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return {"users": users}

@admin_router.put("/users/{user_id}/tier")
async def update_user_tier(user_id: str, tier: str, admin: Dict = Depends(get_admin_user)):
    """Update user's subscription tier"""
    valid_tiers = [t.value for t in InvestorTier]
    if tier not in valid_tiers:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of: {valid_tiers}")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"tier": tier, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": f"User tier updated to {tier}"}

@admin_router.post("/seed-demo-data")
async def seed_demo_data(user: Dict = Depends(get_admin_user)):
    """Seed database with sample Missouri properties"""
    sample_properties = [
        {
            "address": "1234 Troost Ave",
            "city": "Kansas City",
            "state": "MO",
            "zip_code": "64110",
            "county": "Jackson",
            "property_type": "single_family",
            "bedrooms": 3,
            "bathrooms": 1.5,
            "sqft": 1200,
            "year_built": 1955,
            "owner_name": "Estate of James Wilson",
            "owner_phone": "+15551234567",
            "owner_address": "456 Oak St, Dallas, TX 75201",
            "tax_delinquency_years": 3,
            "tax_delinquency_amount": 8500,
            "assessed_value": 45000,
            "estimated_arv": 125000,
            "estimated_repairs": 35000,
            "vacancy_indicators": ["USPS vacant", "Utilities disconnected"],
            "code_violations": ["Overgrown vegetation", "Broken windows"],
            "liens": [{"type": "tax", "amount": 8500}],
            "notes": "Estate property, out-of-state heirs. Motivated to sell."
        },
        {
            "address": "5678 Delmar Blvd",
            "city": "St. Louis",
            "state": "MO",
            "zip_code": "63112",
            "county": "St. Louis City",
            "property_type": "duplex",
            "bedrooms": 4,
            "bathrooms": 2,
            "sqft": 2400,
            "year_built": 1920,
            "owner_name": "Robert Johnson",
            "owner_phone": "+15559876543",
            "owner_address": "789 Pine St, Chicago, IL 60601",
            "tax_delinquency_years": 2,
            "tax_delinquency_amount": 12000,
            "assessed_value": 65000,
            "estimated_arv": 180000,
            "estimated_repairs": 50000,
            "vacancy_indicators": ["Mail accumulation", "Boarded windows"],
            "code_violations": ["Structural damage", "Roof damage"],
            "liens": [{"type": "tax", "amount": 12000}, {"type": "mechanic", "amount": 5000}],
            "notes": "Landlord burnout, extensive repairs needed. Open to terms."
        },
        {
            "address": "910 Campbell Ave",
            "city": "Springfield",
            "state": "MO",
            "zip_code": "65802",
            "county": "Greene",
            "property_type": "single_family",
            "bedrooms": 4,
            "bathrooms": 2,
            "sqft": 1800,
            "year_built": 1970,
            "owner_name": "Mary Thompson",
            "owner_phone": "+15552345678",
            "owner_address": "910 Campbell Ave, Springfield, MO 65802",
            "tax_delinquency_years": 1,
            "tax_delinquency_amount": 3200,
            "assessed_value": 85000,
            "estimated_arv": 165000,
            "estimated_repairs": 25000,
            "vacancy_indicators": [],
            "code_violations": ["Peeling paint"],
            "liens": [],
            "notes": "Divorce situation, needs quick sale. Cooperative seller."
        }
    ]
    
    created = 0
    for prop_data in sample_properties:
        existing = await db.properties.find_one({"address": prop_data["address"]})
        if not existing:
            prop = Property(**prop_data)
            prop.distress_score = calculate_distress_score(prop_data)
            prop.contracted_price = prop_data["estimated_arv"] * 0.65 - prop_data["estimated_repairs"]
            prop.investor_price = prop.contracted_price + 12000  # Default assignment fee
            prop.status = PropertyStatus.UNDER_CONTRACT
            
            prop_dict = prop.model_dump()
            prop_dict["created_at"] = prop_dict["created_at"].isoformat()
            prop_dict["updated_at"] = prop_dict["updated_at"].isoformat()
            
            await db.properties.insert_one(prop_dict)
            created += 1
    
    return {"message": f"Seeded {created} sample properties"}

# ========================== INTEGRATION STATUS ==========================
@api_router.get("/integration-status")
async def get_integration_status():
    """Check status of all required integrations"""
    return {
        "stripe": {
            "configured": bool(os.environ.get('STRIPE_API_KEY')),
            "status": "active" if os.environ.get('STRIPE_API_KEY') else "pending"
        },
        "openai": {
            "configured": bool(os.environ.get('EMERGENT_LLM_KEY')),
            "status": "active" if os.environ.get('EMERGENT_LLM_KEY') else "pending"
        },
        "twilio": {
            "configured": bool(os.environ.get('TWILIO_ACCOUNT_SID')),
            "status": "active" if os.environ.get('TWILIO_ACCOUNT_SID') else "pending",
            "instructions": "Provide TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER"
        },
        "docusign": {
            "configured": bool(os.environ.get('DOCUSIGN_API_KEY')),
            "status": "active" if os.environ.get('DOCUSIGN_API_KEY') else "pending",
            "instructions": "Provide DOCUSIGN_API_KEY for e-signatures"
        },
        "propstream": {
            "configured": bool(os.environ.get('PROPSTREAM_API_KEY')),
            "status": "active" if os.environ.get('PROPSTREAM_API_KEY') else "pending",
            "instructions": "Provide PROPSTREAM_API_KEY for real property data"
        },
        "notarize": {
            "configured": bool(os.environ.get('NOTARIZE_API_KEY')),
            "status": "active" if os.environ.get('NOTARIZE_API_KEY') else "pending",
            "instructions": "Provide NOTARIZE_API_KEY for remote online notarization"
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

# ========================== EXTERNAL INTEGRATIONS ROUTES ==========================
@integrations_router.get("/propstream/status")
async def propstream_status(user: Dict = Depends(get_admin_user)):
    """Check PropStream API configuration status"""
    try:
        from integrations.propstream import propstream_client
        return {
            "service": "PropStream",
            "configured": propstream_client.is_configured,
            "description": "Missouri property data and skip tracing",
            "cost": "$150-400/month + $500 setup",
            "how_to_get": "Call (888) 776-9527 -> Request API access -> Sign data agreement"
        }
    except ImportError:
        return {"service": "PropStream", "configured": False, "error": "Module not loaded"}

@integrations_router.post("/propstream/search")
async def propstream_search(
    counties: List[str] = None,
    min_equity: int = 30,
    limit: int = 100,
    user: Dict = Depends(get_admin_user)
):
    """Search Missouri distressed properties via PropStream"""
    try:
        from integrations.propstream import propstream_client
        result = await propstream_client.search_distressed_properties(
            counties=counties,
            min_equity_percent=min_equity,
            limit=limit
        )
        return result
    except ImportError:
        return {"status": "error", "message": "PropStream module not available"}

@integrations_router.get("/twilio/status")
async def twilio_status(user: Dict = Depends(get_admin_user)):
    """Check Twilio configuration status"""
    try:
        from integrations.twilio_outreach import twilio_client
        return {
            "service": "Twilio",
            "configured": twilio_client.is_configured,
            "description": "SMS and voice outreach to property owners",
            "cost": "Pay-as-you-go: $0.0075/SMS, $0.013/min voice",
            "how_to_get": "twilio.com/try-twilio -> Instant trial key -> Upgrade for production"
        }
    except ImportError:
        return {"service": "Twilio", "configured": False, "error": "Module not loaded"}

@integrations_router.post("/twilio/send-sms")
async def send_twilio_sms(
    property_id: str,
    day: int = 0,
    user: Dict = Depends(get_admin_user)
):
    """Send SMS to property owner"""
    try:
        from integrations.twilio_outreach import twilio_client, OutreachDay
        
        prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        
        if not prop.get("owner_phone"):
            raise HTTPException(status_code=400, detail="Owner phone not available")
        
        owner_name = prop.get("owner_name", "Property Owner")
        owner_first_name = owner_name.split()[0] if owner_name else "there"
        
        property_data = {
            "owner_first_name": owner_first_name,
            "property_address": prop.get("address"),
            "city": prop.get("city"),
            "county": prop.get("county")
        }
        
        outreach_day = OutreachDay(day) if day in [0, 2, 4] else OutreachDay.DAY_0
        result = await twilio_client.send_sms(prop["owner_phone"], property_data, outreach_day)
        return result
        
    except ImportError:
        return {"status": "error", "message": "Twilio module not available"}

@integrations_router.get("/docusign/status")
async def docusign_status(user: Dict = Depends(get_admin_user)):
    """Check DocuSign configuration status"""
    try:
        from integrations.docusign_contracts import docusign_client
        return {
            "service": "DocuSign",
            "configured": docusign_client.is_configured,
            "description": "E-signatures for purchase and assignment contracts",
            "cost": "$25-50/month",
            "how_to_get": "developers.docusign.com -> Create dev account -> Apply for production"
        }
    except ImportError:
        return {"service": "DocuSign", "configured": False, "error": "Module not loaded"}

@integrations_router.post("/docusign/create-envelope")
async def create_docusign_envelope(
    contract_id: str,
    user: Dict = Depends(get_admin_user)
):
    """Create DocuSign envelope for contract signing"""
    try:
        from integrations.docusign_contracts import docusign_client
        
        contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        prop = await db.properties.find_one({"id": contract["property_id"]}, {"_id": 0})
        
        signers = []
        if contract.get("seller_email"):
            signers.append({
                "email": contract["seller_email"],
                "name": contract.get("seller_name", "Seller"),
                "role": "seller"
            })
        if contract.get("buyer_id"):
            buyer = await db.users.find_one({"id": contract["buyer_id"]}, {"_id": 0, "password_hash": 0})
            if buyer:
                signers.append({
                    "email": buyer["email"],
                    "name": f"{buyer['first_name']} {buyer['last_name']}",
                    "role": "buyer"
                })
        
        result = await docusign_client.create_envelope(
            template_type=contract.get("contract_type", "purchase_agreement"),
            contract_data={
                "property_address": prop.get("address") if prop else "N/A",
                "purchase_price": contract.get("purchase_price"),
                "earnest_money": contract.get("earnest_money_deposit"),
                "closing_days": contract.get("closing_days")
            },
            signers=signers,
            property_year_built=prop.get("year_built") if prop else None
        )
        return result
        
    except ImportError:
        return {"status": "error", "message": "DocuSign module not available"}

@integrations_router.get("/notarize/status")
async def notarize_status(user: Dict = Depends(get_admin_user)):
    """Check Notarize.com configuration status"""
    try:
        from integrations.notarize_ron import notarize_client, MISSOURI_RON_REQUIREMENTS
        return {
            "service": "Notarize.com",
            "configured": notarize_client.is_configured,
            "description": "Remote Online Notarization for Missouri deeds",
            "cost": "$25 per notarization",
            "how_to_get": "notarize.com/business -> Schedule sales call -> API agreement",
            "missouri_ron": MISSOURI_RON_REQUIREMENTS
        }
    except ImportError:
        return {"service": "Notarize", "configured": False, "error": "Module not loaded"}

@integrations_router.post("/notarize/create-session")
async def create_notarize_session(
    closing_id: str,
    document_type: str = "warranty_deed",
    user: Dict = Depends(get_admin_user)
):
    """Create remote notarization session"""
    try:
        from integrations.notarize_ron import notarize_client
        
        closing = await db.closing_transactions.find_one({"id": closing_id}, {"_id": 0})
        if not closing:
            raise HTTPException(status_code=404, detail="Closing not found")
        
        contract = await db.contracts.find_one({"id": closing["contract_id"]}, {"_id": 0})
        prop = await db.properties.find_one({"id": closing["property_id"]}, {"_id": 0})
        
        result = await notarize_client.create_notarization_session(
            document_type=document_type,
            signer_info={
                "name": contract.get("seller_name") if contract else "Seller",
                "email": contract.get("seller_email") if contract else "",
                "phone": prop.get("owner_phone") if prop else ""
            },
            document_url="",  # Would be actual signed document URL
            property_address=prop.get("address") if prop else "N/A"
        )
        return result
        
    except ImportError:
        return {"status": "error", "message": "Notarize module not available"}

@integrations_router.get("/all-status")
async def all_integrations_status(user: Dict = Depends(get_admin_user)):
    """Get status of all external integrations"""
    statuses = []
    
    # PropStream
    try:
        from integrations.propstream import propstream_client
        statuses.append({
            "service": "PropStream",
            "configured": propstream_client.is_configured,
            "purpose": "Property data & skip tracing",
            "priority": "HIGH - Required for real property data"
        })
    except:
        statuses.append({"service": "PropStream", "configured": False, "error": "Module error"})
    
    # Twilio
    try:
        from integrations.twilio_outreach import twilio_client
        statuses.append({
            "service": "Twilio",
            "configured": twilio_client.is_configured,
            "purpose": "SMS/Voice seller outreach",
            "priority": "HIGH - Required for automated outreach"
        })
    except:
        statuses.append({"service": "Twilio", "configured": False, "error": "Module error"})
    
    # DocuSign
    try:
        from integrations.docusign_contracts import docusign_client
        statuses.append({
            "service": "DocuSign",
            "configured": docusign_client.is_configured,
            "purpose": "E-signatures on contracts",
            "priority": "HIGH - Required for contract execution"
        })
    except:
        statuses.append({"service": "DocuSign", "configured": False, "error": "Module error"})
    
    # Notarize
    try:
        from integrations.notarize_ron import notarize_client
        statuses.append({
            "service": "Notarize.com",
            "configured": notarize_client.is_configured,
            "purpose": "Remote online notarization",
            "priority": "MEDIUM - Required for deed notarization"
        })
    except:
        statuses.append({"service": "Notarize", "configured": False, "error": "Module error"})
    
    # Built-in integrations
    statuses.append({
        "service": "Stripe",
        "configured": bool(STRIPE_API_KEY),
        "purpose": "Subscriptions & EMD payments",
        "priority": "ACTIVE"
    })
    statuses.append({
        "service": "OpenAI GPT-5.2",
        "configured": bool(os.environ.get('EMERGENT_LLM_KEY')),
        "purpose": "AI property analysis & chatbot",
        "priority": "ACTIVE"
    })
    
    return {"integrations": statuses}

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