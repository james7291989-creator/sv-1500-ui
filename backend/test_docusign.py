import os
from dotenv import load_dotenv
from docusign_esign import ApiClient

# 1. Open the Environment Vault
load_dotenv()

# Mapped to the exact variable names currently in your .env file
INTEGRATION_KEY = os.getenv("CLIENT_ID")
USER_ID = os.getenv("USER_ID")
BASE_URL = "https://demo.docusign.net/restapi"
KEY_FILE_NAME = os.getenv("PRIVATE_KEY_FILE", "private.pem")

# 2. Open the Master Key Vault (Looking for private.pem now)
with open(KEY_FILE_NAME, "r") as key_file:
    RSA_KEY = key_file.read()

print("Igniting the DocuSign Engine...")

try:
    # 3. Build the Engine
    api_client = ApiClient()
    api_client.set_base_path(BASE_URL)
    api_client.set_oauth_host_name("account-d.docusign.com")

    # 4. Execute the Server-to-Server Handshake
    token_response = api_client.request_jwt_user_token(
        client_id=INTEGRATION_KEY,
        user_id=USER_ID,
        oauth_host_name="account-d.docusign.com",
        private_key_bytes=RSA_KEY.encode('utf-8'),
        expires_in=3600,
        scopes=["signature", "impersonation"]
    )

    print("\n✅ MISSION SUCCESS! The vault is open.")
    print("✅ Authentication Token Secured!")
    print("✅ Your Python engine is officially authorized to forge legal ink.")

except Exception as e:
    print("\n❌ ENGINE STALL. Error details:")
    print(e)