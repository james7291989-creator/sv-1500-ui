import requests
import time

print("\n🕵️  RODNEY & SONS OS - SYSTEM DIAGNOSTIC AGENT 🕵️")
print("--------------------------------------------------")
print("Initiating global system ping...\n")

# NOTE: Change this URL to your live Render URL once it's deployed!
# For now, it tests your local engine.
TARGET_URL = "http://127.0.0.1:8000/api/integration-status"

try:
    time.sleep(1) # Simulating secure handshake
    response = requests.get(TARGET_URL)
    
    if response.status_code == 200:
        print("✅ BACKEND SERVER: ONLINE\n")
        data = response.json()
        
        # Interrogate each integration
        for service, info in data.items():
            status = info.get('status', 'unknown').upper()
            if status == "ACTIVE":
                print(f"🟢 {service.upper()}: {status}")
            else:
                print(f"🔴 {service.upper()}: {status} - {info.get('instructions', '')}")
                
        print("\n--------------------------------------------------")
        print("DIAGNOSTIC COMPLETE. ALL SYSTEMS LOGGED.")
    else:
        print(f"❌ TARGET REJECTED CONNECTION. STATUS CODE: {response.status_code}")

except requests.exceptions.ConnectionError:
    print("❌ CRITICAL FAILURE: Cannot reach the backend server.")
    print("Is the engine running? (python -m uvicorn server:app --reload)")