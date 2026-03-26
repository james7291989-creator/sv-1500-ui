import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def execute_ceo_override():
    print("==========================================")
    print("   RODNEYVAULT: CEO OVERRIDE PROTOCOL     ")
    print("==========================================")
    
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    # 1. UPGRADE THE CEO ACCOUNT
    print("\n[INFO] Upgrading your account to PLATINUM ADMIN...")
    update_result = await db.users.update_many(
        {}, # This targets your account since you are the only user so far
        {"$set": {
            "tier": "platinum",
            "subscription_status": "active",
            "is_admin": True
        }}
    )
    print(f"[SUCCESS] {update_result.modified_count} account(s) upgraded to PLATINUM/ACTIVE.")

    # 2. INJECT THE VIP INVENTORY
    print("\n[INFO] Checking current vault inventory...")
    count = await db.properties.count_documents({})

    if count > 0:
        print(f"[SUCCESS] Vault already holds {count} deals. Skipping injection.")
    else:
        print("[INFO] Vault is empty. Injecting SV-1500 Test Deals...")
        test_deals = [
            {
                "id": str(uuid.uuid4()),
                "address": "4512 St Louis Ave",
                "city": "St. Louis",
                "state": "MO",
                "zip_code": "63115",
                "county": "St. Louis City",
                "property_type": "single_family",
                "estimated_arv": 185000,
                "estimated_repairs": 45000,
                "contracted_price": 95000,
                "investor_price": 105000,
                "distress_score": 92,
                "status": "under_contract",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "address": "8904 Gravois Rd",
                "city": "Affton",
                "state": "MO",
                "zip_code": "63123",
                "county": "St. Louis",
                "property_type": "single_family",
                "estimated_arv": 240000,
                "estimated_repairs": 30000,
                "contracted_price": 160000,
                "investor_price": 172000,
                "distress_score": 88,
                "status": "under_contract",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "address": "12301 Fenton Main",
                "city": "Fenton",
                "state": "MO",
                "zip_code": "63026",
                "county": "St. Louis",
                "property_type": "single_family",
                "estimated_arv": 310000,
                "estimated_repairs": 65000,
                "contracted_price": 190000,
                "investor_price": 200000,
                "distress_score": 95,
                "status": "under_contract",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.properties.insert_many(test_deals)
        print("[SUCCESS] 3 VIP Deals successfully injected into RodneyVault!")

    print("\n[ALL TASKS COMPLETE] Go refresh your dashboard.")

if __name__ == "__main__":
    asyncio.run(execute_ceo_override())