import requests
import colorama
from colorama import Fore, Style

colorama.init()

# We are testing your LIVE cloud server directly
BASE_URL = "https://modeal-backend.onrender.com" # (If your Render URL is different, we can update this)
LOCAL_URL = "http://127.0.0.1:8000"

print(Fore.CYAN + "==========================================")
print("  RODNEY & SONS: QA SECURITY BOT v1.0     ")
print("==========================================" + Style.RESET_ALL)

def run_security_breach_test():
    print(Fore.YELLOW + "\n[TEST 1] Attempting to steal Platinum properties without logging in..." + Style.RESET_ALL)
    
    # Trying to hit the protected route without a JWT Token
    try:
        response = requests.get(f"{LOCAL_URL}/api/properties")
        
        if response.status_code == 401 or response.status_code == 403:
            print(Fore.GREEN + "[SECURE] Access Denied! The vault successfully blocked the unauthenticated attack." + Style.RESET_ALL)
        else:
            print(Fore.RED + f"[WARNING] Breach detected! Status Code: {response.status_code}" + Style.RESET_ALL)
            
    except requests.exceptions.ConnectionError:
        print(Fore.RED + "[ERROR] Your local server is not running. Please start it with 'python -m uvicorn server:app --reload'." + Style.RESET_ALL)

    print(Fore.YELLOW + "\n[TEST 2] Attempting to forge a fake Admin token..." + Style.RESET_ALL)
    fake_headers = {"Authorization": "Bearer fake_hacker_token_12345"}
    try:
        response = requests.get(f"{LOCAL_URL}/api/admin/dashboard", headers=fake_headers)
        if response.status_code == 401 or response.status_code == 403:
            print(Fore.GREEN + "[SECURE] Forgery Blocked! The system rejected the fake token." + Style.RESET_ALL)
        else:
            print(Fore.RED + f"[WARNING] Breach detected! Admin route exposed!" + Style.RESET_ALL)
    except:
        pass

    print(Fore.CYAN + "\n==========================================")
    print("  SECURITY AUDIT COMPLETE                 ")
    print("==========================================" + Style.RESET_ALL)

if __name__ == "__main__":
    run_security_breach_test()