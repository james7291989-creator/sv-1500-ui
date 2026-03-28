import urllib.request, json, urllib.parse

url = "https://rodney-vault-api.onrender.com/api/auth/login"

print("--- 🔍 TEST 1: How React is trying to log in (JSON) ---")
try:
    req1 = urllib.request.Request(url, data=json.dumps({"email": "ceo@rodneyvault.com", "password": "MasterPassword123!"}).encode(), headers={"Content-Type": "application/json"})
    print("✅ SUCCESS:", urllib.request.urlopen(req1).read().decode())
except Exception as e:
    print("❌ FAILED:", getattr(e, 'read', lambda: str(e))().decode('utf-8', errors='ignore'))

print("\n--- 🔍 TEST 2: How Python wants it (Form Data) ---")
try:
    req2 = urllib.request.Request(url, data=urllib.parse.urlencode({"username": "ceo@rodneyvault.com", "password": "MasterPassword123!"}).encode(), headers={"Content-Type": "application/x-www-form-urlencoded"})
    print("✅ SUCCESS:", urllib.request.urlopen(req2).read().decode())
except Exception as e:
    print("❌ FAILED:", getattr(e, 'read', lambda: str(e))().decode('utf-8', errors='ignore'))