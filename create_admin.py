import pymongo, bcrypt
client = pymongo.MongoClient("mongodb+srv://james7291989_db_user:Imaking1.@rodneyvault.oyhly2g.mongodb.net/?appName=RodneyVault")
db = client["rodney_production"]
hashed = bcrypt.hashpw("MasterPassword123!".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
db.users.update_one({"email": "james@rodneyvault.com"}, {"$set": {"password": hashed, "role": "admin", "is_active": True}}, upsert=True)
print("\n--- SUCCESS: MASTER LOGIN CREATED! ---")
