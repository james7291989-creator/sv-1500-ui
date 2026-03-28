import os
import re
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

print("🔗 Connecting to Live Cloud Vault...")
client = MongoClient(MONGO_URI)
db = client.sv1500_db
properties_collection = db.properties

# The raw St. Louis City Land Tax Sale 236 data
RAW_DATA = """
236-002 LANDING LOFTS & TAVERN LLC 721 N 2ND ST $117,697.00
236-005 CURLEE INVESTMENT LLC 1001 WASHINGTON AV $358,419.00
236-006 MTP-909 CHESTNUT PROPCO LLC 900 PINE ST $32,011.00
236-008 HERBERT DEVELOPMENT & FINANCIAL RICHA 1552 S 7TH ST $6,918.00
236-012 INFINITE STARLIGHT CORP 1403 WASHINGTON AV $38,120.00
236-013 INFINITE STARLIGHT CORP 1403 WASHINGTON AV $40,891.00
236-014 FILIPONE, REGINA E 1635 WASHINGTON AV $10,375.00
236-015 CURLEE INVESTMENT LLC 713 N 11TH ST $87,857.00
236-018 GREYHOUND LINES INC C/O DUCHARME, MC 1011 R CASS AV $2,167.00
236-021 TONEY, CLAUDETTE M 1701 N BROADWAY ST $1,876.00
236-022 TONEY, CLAUDETTE M 701 HOWARD ST $1,178.00
236-023 TONEY, CLAUDETTE M 705 HOWARD ST $1,412.00
236-024 MUBEEN INVESTMENT GROUP INC 1800 N 9TH ST $12,387.00
236-025 MUBEEN INVESTMENTS GROUP INC 1815 N 9TH ST $16,215.00
236-029 ORO LLC 1400 COLLINS ST $25,961.00
236-030 BILLS NEXT PROJECT LLC 1731 S 3RD ST $6,748.00
236-036 WEATHERFORD, JACK O JR 1611 LOCUST ST $21,160.00
236-037 BARTOLO, PETER J 1520 WASHINGTON AV $11,512.00
236-038 MOSER, AARON P 507 N 13TH ST $10,393.00
236-039 GREEN, LORI 1204 WASHINGTON AV $14,264.00
236-040 FREINBERG, PHILIP TRS 410 N JEFFERSON AV $20,041.00
236-041 HOW YOU LIKE ME NOW LLC 2719 JAMES COOL PAPA BELL AV $5,292.00
236-042 JOHNSON, ROBERT JR & SHONTA L CUNNING 2804 GAMBLE ST $6,727.00
236-046 RAY, NICHOLAS 3050 THOMAS ST $4,653.00
236-047 J V L 1998 APARTMENTS LLC 3035 JAMES COOL PAPA BELL AV $18,665.00
236-048 HOBY, LAWRENCE FOSTER 1306 WEBSTER AV $1,042.00
236-049 J V L 1998 APARTMENTS LLC 3032 SHERIDAN AV $15,336.00
236-050 HASKINS, GENERAL & JOHNSON, JAMES 2812 25TH ST $789.00
236-052 KELLEY, DEANDRE 2244 HEBERT ST $11,773.00
236-053 COLE, HOZELL JR 2212 ST LOUIS AV $3,744.00
236-054 MBAKA, CECILY 2206 ST LOUIS AV $11,571.00
236-055 JACKSON, BARBARA 2831 RAUSCHENBACH AV $2,834.00
236-057 DAVIS, JONATHAN K & ROCHELLE D 1535 BENTON ST $717.00
236-058 WASHBURN, TONI SUE & WILLIE EARL LITTLE 1422 BENTON ST $6,809.00
236-060 GOLDSMITH, MARGARET 1423 BENTON ST $819.00
236-062 1225 STL AVE LOFTS LLC 1217 ST LOUIS AV $746.00
236-064 RANDLE, KENDRICK A SR 3219 N 20TH ST $968.00
236-065 CORK, CHRIS 3332 N FLORISSANT AV $4,897.00
236-066 TOPSTONE INV STL 1 LLC 3727 N 20TH ST $5,459.00
236-068 WILLIAMS, CONTRELL 1924 ANGELRODT ST $1,986.00
236-073 RA-EL, MOOSUN 3415 BLAIR AV $7,225.00
236-074 HALL, WILLIAM 1531 ANGELRODT ST $1,961.00
236-076 ZUYA LLC 3514 BLAIR AV $7,964.00
236-077 CONVENIENT COMMUNITY RESOURCES 1400 SALISBURY ST $6,633.00
236-078 KIRK, RONALD TRS 1419 SALISBURY ST $746.00
236-079 BRADLEY, MAURICE 3408 N 14TH ST $5,209.00
236-080 REHMAN, ZUBAIDHA 3327 N 9TH ST $1,551.00
236-081 HENDERSON, CHRISTOPHER 3744 N 9TH ST $3,038.00
236-082 CONNER, BETTY ANN 3937 N FLORISSANT AV $1,072.00
236-084 JORDAN, BERNICE 3921 N 22ND ST $4,643.00
236-085 DAY, ROBERT S & DENNIS S 1412 S 18TH ST $23,801.00
"""

new_assets = []
print("⚙️ Scrubbing Raw Government Data...")

# Process each line
for line in RAW_DATA.split('\n'):
    line = line.strip()
    if not line or not line.startswith('236-'):
        continue
        
    try:
        # Split by the dollar sign to isolate the tax debt
        parts = line.split('$')
        if len(parts) != 2:
            continue
            
        tax_debt = parts[1].strip()
        main_text = parts[0].strip()
        
        # Regex to find the address (Looks for numbers followed by street names)
        address_match = re.search(r'(\d{2,5}\s+[A-Z0-9\s]+(?:ST|AV|AVE|BLVD|PL|CT|DR|RD))$', main_text)
        
        if address_match:
            address = address_match.group(1).strip()
            
            # Create the asset and TAG IT AS A LEAD
            asset = {
                "address": address,
                "city": "St. Louis",
                "state": "MO",
                "county": "St. Louis City",
                "property_type": "Tax Sale Asset",
                "status": "lead", # <-- THIS ROUTES IT TO THE OPEN MARKET TAB
                "tax_debt": f"${tax_debt}",
                "distress_score": 99
            }
            new_assets.append(asset)
    except Exception as e:
        continue

if new_assets:
    print(f"💉 Injecting {len(new_assets)} Scrubbed Tax Assets to the Cloud...")
    properties_collection.insert_many(new_assets)
    print(f"✅ SUCCESS: {len(new_assets)} Exclusive Leads Locked into the Database!")
else:
    print("❌ Failed to parse addresses. Check data format.")