import os
import csv
import uuid
import certifi
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# === CONFIGURATION ===
MONGO_URL = "mongodb+srv://james7291989_db_user:Imaking1.@rodneyvault.oyhly2g.mongodb.net/?retryWrites=true&w=majority&appName=RodneyVault"
DB_NAME = "modeal"
CSV_FILE = "LRA_INVENTORY_AVAILABLE.csv"

async def inject_data():
    print(f"🚀 Initializing SV-1500 Data Injection...")
    client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    
    properties_to_inject = []
    
    with open(CSV_FILE, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Building the property object based on your CSV headers
            prop = {
                "id": str(uuid.uuid4()),
                "parcel_id": row.get('ParcelId'),
                "address": row.get('Address'),
                "city": "St. Louis", # LRA is specific to STL
                "neighborhood": row.get('NeighborhoodName'),
                "sqft": row.get('SQFT'),
                "property_type": row.get('PropertyType'),
                "estimated_arv": 150000, # Placeholder for manual adjustment
                "asking_price": 5000,    # LRA properties are often very low cost
                "distress_score": 85,    # County inventory is high-distress by default
                "status": "new",         # This makes it show up on your Dashboard
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            properties_to_inject.append(prop)
            
            if len(properties_to_inject) >= 100: # Inject in batches for speed
                await db.properties.insert_many(properties_to_inject)
                print(f"✅ Injected 100 properties: {prop['address']}")
                properties_to_inject = []

    # Final batch
    if properties_to_inject:
        await db.properties.insert_many(properties_to_inject)
    
    print("Mission Complete. County Inventory is now LIVE in the Rodney Vault.")

if __name__ == "__main__":
    asyncio.run(inject_data())