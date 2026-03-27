import requests
import sys

print("\n🌐 RODNEY & SONS OS - LIVE PRODUCTION DIAGNOSTIC 🌐")
print("===================================================")

# Hardcoded URLs for instant execution
vercel_url = "https://n-smoky-sigma.vercel.app"
render_url = "https://rodney-vault-api.onrender.com"

print(f"\n[1] PINGING FRONTEND: {vercel_url} ...")
try:
    v_res = requests.get(vercel_url)
    if v_res.status_code == 200:
        print("✅ Vercel UI is LIVE and responding.")
    else:
        print(f"❌ Vercel returned status code: {v_res.status_code}")
except Exception as e:
    print(f"❌ Vercel Ping Failed: {e}")

print(f"\n[2] PINGING BACKEND API: {render_url} ...")
api_target = f"{render_url}/api/integration-status"
try:
    r_res = requests.get(api_target)
    if r_res.status_code == 200:
        print("✅ Render API is LIVE and processing requests.")
        data = r_res.json()
        
        print("\n[3] LIVE INTEGRATION STATUS:")
        for service, info in data.items():
            status = info.get('status', 'unknown').upper()
            if status == "ACTIVE":
                print(f"  🟢 {service.upper()}: ACTIVE")
            else:
                print(f"  🔴 {service.upper()}: {status} - Missing Keys in Render Environment")
    else:
        print(f"❌ Render API rejected the connection. Status: {r_res.status_code}")
except Exception as e:
    print(f"❌ Render Ping Failed. Error: {e}")

print("\n===================================================")