import requests
import json

API_URL = "https://rodney-vault-api.onrender.com/api/properties"

# Missouri Trustee / Tax Default List (Simulated County Feed)
trustee_properties = [
    {
        "address": "LOCKED FOR NON-PLATINUM", 
        "city": "St. Louis",
        "state": "MO",
        "zip_code": "63115",
        "county": "St. Louis City",
        "property_type": "single_family",
        "tax_delinquency_years": 4,
        "tax_delinquency_amount": 12450.00,
        "assessed_value": 45000,
        "estimated_arv": 115000,
        "notes": "COUNTY TRUSTEE LIST: Post-3rd Sale. Vacant. Code violations present."
    },
    {
        "address": "LOCKED FOR NON-PLATINUM", 
        "city": "Kansas City",
        "state": "MO",
        "zip_code": "64128",
        "county": "Jackson",
        "property_type": "single_family",
        "tax_delinquency_years": 3,
        "tax_delinquency_amount": 8900.00,
        "assessed_value": 62000,
        "estimated_arv": 140000,
        "notes": "COUNTY TRUSTEE LIST: Overgrown lot, structural damage reported."
    },
    {
        "address": "LOCKED FOR NON-PLATINUM", 
        "city": "Springfield",
        "state": "MO",
        "zip_code": "65803",
        "county": "Greene",
        "property_type": "single_family",
        "tax_delinquency_years": 5,
        "tax_delinquency_amount": 15200.00,
        "assessed_value": 38000,
        "estimated_arv": 105000,
        "notes": "COUNTY TRUSTEE LIST: Extreme distress. Immediate title acquisition possible via county OTC."
    }
]

headers = {"Content-Type": "application/json"}

print("Uploading Missouri County Trustee Data...")
for prop in trustee_properties:
    try:
        res = requests.post(API_URL, json=prop, headers=headers)
        if res.status_code in [200, 201]:
            print(f"✅ Uploaded asset in {prop['city']}, {prop['county']} County.")
        else:
            print(f"❌ Failed: {res.text}")
    except Exception as e:
        print(f"Error: {e}")