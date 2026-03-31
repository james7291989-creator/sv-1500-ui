import os
import certifi
from flask import Flask, request, jsonify
from flask_cors import CORS
from motor.motor_asyncio import AsyncIOMotorClient
from docusign_esign import ApiClient, EnvelopesApi, EnvelopeDefinition, TemplateRole
from dotenv import load_dotenv
from auto_bidder import execute_autonomous_bid

load_dotenv()
app = Flask(__name__)
CORS(app)

# === VAULT CONFIG ===
MONGO_URL = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
db = client["modeal"]

# === DOCUSIGN JWT CONFIG ===
INTEGRATION_KEY = os.getenv("CLIENT_ID")
USER_ID = os.getenv("USER_ID")
KEY_FILE_NAME = os.getenv("PRIVATE_KEY_FILE", "private.pem")

# === THE "TITAN" AUTONOMOUS ROUTE ===
@app.route('/api/lock-and-assign', methods=['POST'])
async def lock_and_assign():
    try:
        data = await request.get_json()
        user_email = data.get('email')
        user_name = data.get('name', 'Serious Investor')
        prop_id = data.get('property_id')

        # 1. FETCH PROPERTY
        prop = await db.properties.find_one({"id": prop_id})
        if not prop: return jsonify({"error": "Property not found"}), 404

        # 2. RUN AUTO-BIDDER (Generates County PDF)
        bid_success = await execute_autonomous_bid(prop, {"name": user_name, "email": user_email})
        if not bid_success:
            return jsonify({"error": "Failed to generate County Bid PDF. Check server logs."}), 500

        # 3. TRIGGER DOCUSIGN (Legal Signature)
        with open(KEY_FILE_NAME, "r") as f: RSA_KEY = f.read()
        
        api_client = ApiClient()
        api_client.set_base_path("https://demo.docusign.net/restapi")
        token_response = api_client.request_jwt_user_token(
            client_id=INTEGRATION_KEY, user_id=USER_ID,
            oauth_host_name="account-d.docusign.com",
            private_key_bytes=RSA_KEY.encode('utf-8'),
            expires_in=3600, scopes=["signature", "impersonation"]
        )
        
        api_client.set_default_header("Authorization", f"Bearer {token_response.access_token}")
        
        envelope_definition = EnvelopeDefinition(
            status="sent", 
            template_id=os.getenv("DOCUSIGN_TEMPLATE_ID"),
            template_roles=[TemplateRole(email=user_email, name=user_name, role_name="Investor")]
        )
        
        env_api = EnvelopesApi(api_client)
        results = env_api.create_envelope(account_id=os.getenv("DOCUSIGN_ACCOUNT_ID"), envelope_definition=envelope_definition)

        return jsonify({
            "status": "Success",
            "message": "Circuit complete. County Bid Prepared. Contract Emailed.",
            "envelope_id": results.envelope_id
        })

    except Exception as e:
        print(f"ERROR: {e}")
        return jsonify({"status": "Error", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)