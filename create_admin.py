import pymongo, bcrypt, uuid
from datetime import datetime, timezone

# 1. Connect to the live vault
client = pymongo.MongoClient("mongodb+srv://james7291989_db_user:Imaking1.@rodneyvault.oyhly2g.mongodb.net/?appName=RodneyVault")
db = client["rodney_production"]

# 2. Hash the password correctly
hashed = bcrypt.hashpw("MasterPassword123!".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# 3. Inject the EXACT schema the FastAPI backend expects
user_data = {
    "password_hash": hashed,  # FIXED: Matches server.py
    "is_admin": True,         # FIXED: Matches server.py
    "is_active": True,
    "first_name": "James",
    "last_name": "Admin",
    "tier": "platinum"
}

db.users.update_one(
    {"email": "james@rodneyvault.com"}, 
    {
        "$set": user_data,
        "$setOnInsert": {
            "id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    }, 
    upsert=True
)

print("\n--- SUCCESS: MASTER LOGIN FIXED & RE-CREATED! ---")