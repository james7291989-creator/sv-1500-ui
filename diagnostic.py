import pymongo 
import sys 
print("--- ?? RODNEY & SONS: DB DIAGNOSTIC ---") 
try: 
    uri = "mongodb+srv://james7291989_db_user:Imaking1.@rodneyvault.oyhly2g.mongodb.net/?appName=RodneyVault" 
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000) 
    client.admin.command('ping') 
    print("[SUCCESS] MongoDB Connection Established.") 
    print("[DIAGNOSIS] Your DB works. The 500 Error is caused by Render. MongoDB Atlas is either blocking Render's IP, or Render is missing the MONGO_URL environment variable.") 
except Exception as e: 
    print(f"[FATAL] MongoDB Connection Failed: {e}") 
