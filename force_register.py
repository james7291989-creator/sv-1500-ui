import urllib.request
import json

url = "https://rodney-vault-api.onrender.com/api/auth/register"
data = {
    "email": "ceo@rodneyvault.com",
    "password": "MasterPassword123!",
    "first_name": "James",
    "last_name": "Admin",
    "tier": "platinum"
}

req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req) as response:
        print("\n--- 🟢 SUCCESS! CEO ACCOUNT CREATED IN THE LIVE DATABASE! ---")
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print("\n--- 🔴 ERROR ---")
    print(e.code, e.read().decode())