import os
import uuid
import certifi
import re
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# === VAULT CONFIG ===
MONGO_URL = "mongodb+srv://james7291989_db_user:Imaking1.@rodneyvault.oyhly2g.mongodb.net/?retryWrites=true&w=majority&appName=RodneyVault"
DB_NAME = "modeal"

# --- DATA BLOCKS ---
GREENE_COUNTY = """
88-13-15-102-021 AKIN REAL ESTATE LLC 2023 2024 $853.83 NORTH OAKLAND ADD E 50.5 FT LOT 24 BLK D
88-13-10-406-001 BRUCE, DOUGLAS 2021 2022 2023 2024 $9,244.32 *Third Offer* HAMEL'S ADD, W V LOT 117
88-06-21-404-008 FEDERAL NATL MORTGAGE ASSOCIATION 2021 2022 2023 2024 $624.07 *Third Offer* ASH GROVE IRR
"""

JACKSON_COUNTY = """
14-730-02-38-00-0-00-000 114 S WILLOW AVE SUGAR CREEK 64053 VACANT RES LAND $ 9,506 $ 95,060
14-820-05-03-00-0-00-000 9210 E NORLEDGE AVE INDEPENDENCE 64053 VACANT RES LAND $ 5,000 $ 50,000
15-930-13-06-00-0-00-000 12017 LEXINGTON AVE SUGAR CREEK 64054 SF RESIDENCE $ 3,540 $ 83,990
"""

JEFFCO_MO_TRUSTEE = """
01402004003059 2025 7,807.28 $ 875 HILL CT ARNOLD MO 63010 HIGHLAND PARK SOUTH 1 LOT 34
03602301001068 2025 1,647.04 $ 5704 HILL DR HIGH RIDGE MO 63049 PT N 1/2 NE 1/4 
0370250300101809 2025 3,424.62 $ 5520 CIRCLE VIEW DR HOUSE SPRINGS 63051 BEAR CREEK ESTS 2 LOT 9
12803302001075 2018 709.26 $ 10224 BELEW CREEK DR HILLSBORO 63050 RAINTREE PLANTATION SEC 20 LOT 77
"""

async def master_injection():
    client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    master_inventory = []
    timestamp = datetime.now(timezone.utc).isoformat()

    # 1. PARSE GREENE
    for line in GREENE_COUNTY.strip().split('\n'):
        if not line.strip(): continue
        try:
            parts = line.split(' ')
            money_idx = next(i for i, s in enumerate(parts) if '$' in s)
            val = float(parts[money_idx].replace('$', '').replace(',', ''))
            master_inventory.append({
                "id": str(uuid.uuid4()), "address": f"Tax ID: {parts[0]}", "city": "Springfield", 
                "county": "Greene", "asking_price": val, "distress_score": 95, "status": "new", "created_at": timestamp
            })
        except: continue

    # 2. PARSE JACKSON (The Error Fix)
    for line in JACKSON_COUNTY.strip().split('\n'):
        if not line.strip(): continue
        try:
            parts = re.sub(r'\s+', ' ', line).strip().split(' ')
            # Look for the last numbers in the line that could be prices
            prices = [p for p in parts if p.replace('$','').replace(',','').replace('.','').isdigit()]
            if len(prices) >= 2:
                val = float(prices[-2].replace('$', '').replace(',', ''))
                master_inventory.append({
                    "id": str(uuid.uuid4()), "address": " ".join(parts[1:4]), "city": parts[4], 
                    "county": "Jackson", "asking_price": val, "distress_score": 92, "status": "new", "created_at": timestamp
                })
        except: continue

    # 3. PARSE JEFFCO
    for line in JEFFCO_MO_TRUSTEE.strip().split('\n'):
        if not line.strip(): continue
        try:
            parts = re.sub(r'\s+', ' ', line).strip().split(' ')
            if '$' in parts:
                money_idx = parts.index('$')
                val = float(parts[money_idx-1].replace('$', '').replace(',', ''))
                master_inventory.append({
                    "id": str(uuid.uuid4()), "address": " ".join(parts[money_idx+1:money_idx+5]), 
                    "city": "Jefferson County", "county": "Jefferson", "asking_price": val, 
                    "distress_score": 98, "status": "new", "created_at": timestamp
                })
        except: continue

    if master_inventory:
        await db.properties.insert_many(master_inventory)
        print(f"✅ MISSION COMPLETE: {len(master_inventory)} Missouri Assets are now LIVE in the Rodney Vault.")
    else:
        print("❌ Error: No valid data was found to inject.")

if __name__ == "__main__":
    asyncio.run(master_injection())