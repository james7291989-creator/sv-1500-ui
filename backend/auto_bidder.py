import io
import os
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# --- TITAN AUTO-BIDDER ENGINE ---

def generate_jeffco_bid(parcel_id, bid_amount, bidder_name):
    """Fills the Jefferson County Trustee Bid Form automatically."""
    template_path = "templates/jeffco_trustee_template.pdf"
    output_path = f"outbox/BID_{parcel_id}.pdf"
    
    # Safety check: ensure template exists
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Missing Template: Please put jeffco_trustee_template.pdf inside the templates folder.")

    # Create an overlay with your data
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    
    # Coordinates (Approximate for the 2026 form - we can tweak these later)
    can.drawString(100, 650, bidder_name)  # Name
    can.drawString(100, 580, str(parcel_id))    # Parcel Number
    can.drawString(100, 550, f"${bid_amount}") # Amount
    can.save()
    
    packet.seek(0)
    new_pdf = PdfReader(packet)
    existing_pdf = PdfReader(open(template_path, "rb"))
    output = PdfWriter()
    
    page = existing_pdf.pages[0]
    page.merge_page(new_pdf.pages[0])
    output.add_page(page)
    
    with open(output_path, "wb") as outputStream:
        output.write(outputStream)
    
    return output_path

# --- TRIGGER: This fires when the user clicks 'Lock & Assign' ---
async def execute_autonomous_bid(prop_data, user_data):
    try:
        # 1. Generate the PDF
        file_path = generate_jeffco_bid(
            parcel_id=prop_data.get('address', 'UNKNOWN_PARCEL'), 
            bid_amount=prop_data.get('asking_price', '1000'), 
            bidder_name="Rodney & Sons LLC"
        )
        
        # 2. EMAIL LOGIC GOES HERE (Currently logging success)
        print(f"🚀 [AUTO-BIDDER] SUCCESS: PDF generated at {file_path}")
        return True
    except Exception as e:
        print(f"❌ [AUTO-BIDDER] ERROR: {e}")
        return False