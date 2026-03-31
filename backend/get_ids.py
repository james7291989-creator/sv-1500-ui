 
import os
from dotenv import load_dotenv
from docusign_esign import ApiClient, TemplatesApi

# Open the Vault
load_dotenv()
INTEGRATION_KEY = os.getenv("CLIENT_ID")
USER_ID = os.getenv("USER_ID")
KEY_FILE_NAME = os.getenv("PRIVATE_KEY_FILE", "private.pem")

with open(KEY_FILE_NAME, "r") as key_file:
    RSA_KEY = key_file.read()

print("🚀 Launching DocuSign Recon Bot...")

try:
    # 1. Bypass the Website and Authenticate
    api_client = ApiClient()
    api_client.set_oauth_host_name("account-d.docusign.com")
    token_response = api_client.request_jwt_user_token(
        client_id=INTEGRATION_KEY,
        user_id=USER_ID,
        oauth_host_name="account-d.docusign.com",
        private_key_bytes=RSA_KEY.encode('utf-8'),
        expires_in=3600,
        scopes=["signature", "impersonation"]
    )

    access_token = token_response.access_token
    
    # 2. Extract Account ID
    user_info = api_client.get_user_info(access_token)
    account_id = user_info.accounts[0].account_id
    base_uri = user_info.accounts[0].base_uri

    print("\n========================================")
    print(f"✅ YOUR ACCOUNT ID: {account_id}")
    print("========================================\n")

    # 3. Extract Template IDs
    api_client.set_base_path(base_uri + "/restapi")
    api_client.set_default_header("Authorization", "Bearer " + access_token)
    
    templates_api = TemplatesApi(api_client)
    templates = templates_api.list_templates(account_id)

    print("📄 YOUR TEMPLATE IDs:")
    if not templates.envelope_templates:
        print("   ⚠️ No templates found! You need to create an 'Assignment of Contract' template on DocuSign.com first.")
    else:
        for t in templates.envelope_templates:
            print(f"   Name: {t.name}")
            print(f"   ID:   {t.template_id}\n")
    print("========================================")

except Exception as e:
    print(f"\n❌ Error: {e}")