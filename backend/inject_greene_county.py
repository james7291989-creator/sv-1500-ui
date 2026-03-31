import os
import uuid
import certifi
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# === VAULT CONFIG ===
MONGO_URL = "mongodb+srv://james7291989_db_user:Imaking1.@rodneyvault.oyhly2g.mongodb.net/?retryWrites=true&w=majority&appName=RodneyVault"
DB_NAME = "modeal"

# RAW DATA FROM CEO
raw_data = """
88-13-15-102-021 AKIN REAL ESTATE LLC 2023 2024 $853.83 NORTH OAKLAND ADD E 50.5 FT LOT 24 BLK D
88-13-14-227-016 ALLEN, RONALD 2023 2024 $4,726.35 GRAYDON PLACE ADD LOT 29
88-13-10-406-001 BRUCE, DOUGLAS 2021 2022 2023 2024 $9,244.32 *Third Offer* HAMEL'S ADD, W V LOT 117
88-13-12-206-015 COLE, RICKY EUGENE 2021 2022 2023 2024 $11,430.69 *Third Offer* EMERY & MC CANN ADD LOT 13 BLK 4
88-06-21-404-008 FEDERAL NATL MORTGAGE ASSOCIATION 2021 2022 2023 2024 $624.07 *Third Offer* ASH GROVE IRR
"""

async def inject_greene():
    client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    
    lines = raw_data.strip().split('\n')
    properties = []

    for line in lines:
        parts = line.split(' ')
        tax_id = parts[0]
        # Find the dollar sign to separate name from description
        money_idx = next(i for i, s in enumerate(parts) if '$' in s)
        amount = parts[money_idx]
        description = " ".join(parts[money_idx+1:])
        
        prop = {
            "id": str(uuid.uuid4()),
            "tax_id": tax_id,
            "address": f"Tax ID: {tax_id}", # Placeholder until we skip-trace address
            "city": "Springfield / Greene County",
            "county": "Greene",
            "estimated_arv": 175000,
            "asking_price": amount.replace('$', '').replace(',', ''),
            "distress_score": 98 if "Third Offer" in line else 90,
            "legal_description": description,
            "status": "new",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        properties.append(prop)

    if properties:
        await db.properties.insert_many(properties)
        print(f"✅ Success: {len(properties)} Greene County leads injected into the Rodney Vault.")

if __name__ == "__main__":
    asyncio.run(inject_greene())