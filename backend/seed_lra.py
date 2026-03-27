import os
import csv
import uuid
import re
import certifi
from datetime import datetime, timezone
from pymongo import MongoClient

# 1. HARDWIRED LIVE CLOUD CREDENTIALS
mongo_url = "mongodb+srv://james7291989_db_user:Imaking1.@rodneyvault.oyhly2g.mongodb.net/?retryWrites=true&w=majority&appName=RodneyVault"
db_name = "modeal"

print(f"🔗 Connecting to Live Cloud Vault: {db_name}...")
# certifi ensures Windows allows the secure connection to MongoDB Atlas
client = MongoClient(mongo_url, tlsCAFile=certifi.where())
db = client[db_name]

real_deals = []

print("📂 Parsing Master LRA Inventory...")
try:
    with open('LRA_INVENTORY_AVAILABLE.csv', mode='r', encoding='utf-8-sig') as file:
        reader = csv.DictReader(file)
        count = 0
        
        for row in reader:
            if count >= 100: break # Locking in 100 prime deals
                
            raw_address = row.get('Address', '').strip()
            # Clean up the weird government spacing
            clean_address = re.sub(' +', ' ', raw_address)
            
            if clean_address:
                deal = {
                    "id": str(uuid.uuid4()),
                    "parcel_id": row.get('ParcelId', 'N/A'),
                    "address": clean_address,
                    "city": "St. Louis",
                    "state": "MO",
                    "zip_code": "63101", 
                    "county": "St. Louis City",
                    "property_type": "LRA Distressed Asset",
                    "distress_score": 99, 
                    "estimated_arv": 145000, 
                    "estimated_repairs": 55000,
                    "investor_price": 12500, # Massive wholesale spread
                    "status": "new",
                    "closeable": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                real_deals.append(deal)
                count += 1

    print("🗑️ Wiping old database entries...")
    db.properties.delete_many({})

    if real_deals:
        print("💉 Injecting assets to the cloud...")
        db.properties.insert_many(real_deals)
        print(f"✅ SUCCESS: {len(real_deals)} Real Properties Locked into the Live Cloud Database!")
    else:
        print("❌ ERROR: File parsed but no addresses found.")

except FileNotFoundError:
    print("❌ ERROR: 'LRA_INVENTORY_AVAILABLE.csv' not found. Ensure it is inside your backend folder.")
except Exception as e:
    print(f"❌ SYSTEM CRASH: {str(e)}")