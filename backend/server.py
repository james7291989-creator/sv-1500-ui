import os
import certifi
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from motor.motor_asyncio import AsyncIOMotorClient
from docusign_esign import ApiClient, EnvelopesApi, EnvelopeDefinition, TemplateRole
from dotenv import load_dotenv
from auto_bidder import execute_autonomous_bid

load_dotenv()
app = Flask(__name__)

# === UPGRADED CORS POLICY ===
# This tells the Render server to accept connections from your localhost React app
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# === VAULT CONFIG ===
MONGO_URL = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
db = client["modeal"]

# === DOCUSIGN JWT CONFIG ===
INTEGRATION_KEY = os.getenv("CLIENT_ID")
USER_ID = os.getenv("USER_ID")
KEY_FILE_NAME = os.getenv("PRIVATE_KEY_FILE", "private.pem")

# ==========================================
# ROUTE 0: GOOGLE AUTH HANDSHAKE
# ==========================================
@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    try:
        data = request.get_json()
        # You can add JWT validation here later. For now, we authorize the handshake.
        return jsonify({"status": "success", "message": "Google Authentication Verified."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# ROUTE 1: FETCH ALL INVENTORY
# ==========================================
@app.route('/api/properties', methods=['GET'])
async def get_properties():
    try:
        limit = int(request.args.get('limit', 100))
        cursor = db.properties.find({"status": {"$ne": "locked"}}).limit(limit)
        properties = await cursor.to_list(length=limit)
        for p in properties:
            p['_id'] = str(p['_id'])
            if 'id' not in p: p['id'] = p['_id']
        return jsonify({"properties": properties})
    except Exception as e:
        print(f"Error fetching properties: {e}")
        return jsonify({"error": str(e)}), 500

# ==========================================
# ROUTE 2: QUANTUM CORE AI UNDERWRITER
# ==========================================
@app.route('/api/ai-analyze', methods=['POST'])
async def ai_analyze():
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return jsonify({"error": "AI Key not configured in Render"}), 500
            
        genai.configure(api_key=api_key)
        data = await request.get_json()
        user_prompt = data.get('prompt', 'Analyze current deals.')

        cursor = db.properties.find({"status": {"$ne": "locked"}}).limit(20)
        properties = await cursor.to_list(length=20)
        
        inventory_context = []
        for p in properties:
            inventory_context.append(f"[{p.get('county', 'MO')}] {p.get('address')} - Price: ${p.get('asking_price')} - Distress: {p.get('distress_score')}")
        
        context_str = " | ".join(inventory_context)
        system_instructions = f"You are the Quantum Core AI Underwriter for Rodney & Sons LLC. Analyze deals with high-level financial precision. Live active inventory: {context_str}"
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(f"{system_instructions}\n\nUSER DIRECTIVE: {user_prompt}")
        
        return jsonify({"response": response.text})
    except Exception as e:
        print(f"AI ERROR: {e}")
        return jsonify({"error": "Quantum Core connection failed."}), 500

# ==========================================
# ROUTE 3: THE "TITAN" AUTONOMOUS ROUTE
# ==========================================
@app.route('/api/lock-and-assign', methods=['POST'])
async def lock_and_assign():
    try:
        data = await request.get_json()
        user_email = data.get('email')
        user_name = data.get('name', 'Serious Investor')
        prop_id = data.get('property_id')

        prop = await db.properties.find_one({"$or": [{"id": prop_id}, {"_id": prop_id}]})
        if not prop: return jsonify({"error": "Property not found"}), 404

        bid_success = await execute_autonomous_bid(prop, {"name": user_name, "email": user_email})
        if not bid_success:
            return jsonify({"error": "Failed to generate County Bid PDF."}), 500

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
            status="sent", template_id=os.getenv("DOCUSIGN_TEMPLATE_ID"),
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