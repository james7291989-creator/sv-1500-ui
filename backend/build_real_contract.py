from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def build_contract():
    path = r'C:\Users\james\Projects\sv-1500-ui\backend\Official_Assignment_Contract.pdf'
    c = canvas.Canvas(path, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width/2, height - 50, "ASSIGNMENT OF REAL ESTATE PURCHASE AND SALE AGREEMENT")
    
    c.setFont("Helvetica", 12)
    text = c.beginText(50, height - 100)
    text.setLeading(20) # <-- This is the exact fix
    
    # Body Paragraphs
    lines = [
        "This Assignment of Contract (the \"Assignment\") is entered into by and between:",
        "",
        "ASSIGNOR: Rodney & Sons LLC",
        "ASSIGNEE: _________________________________________ (Name of Investor)",
        "",
        "1. THE PROPERTY: Assignor has secured the right to purchase the property located at:",
        "Property Address: _________________________________________",
        "Parcel ID: _________________________________________",
        "",
        "2. ASSIGNMENT: Assignor hereby assigns, transfers, and conveys to Assignee all of Assignor's ",
        "rights, title, and interest in and to the purchase of the aforementioned property.",
        "",
        "3. ASSIGNMENT FEE: In consideration for this assignment, Assignee agrees to pay Assignor ",
        "an Assignment Fee. This fee shall be paid through escrow at closing.",
        "",
        "4. EARNEST MONEY DEPOSIT (EMD): Assignee agrees to submit a non-refundable Earnest",
        "Money Deposit in the amount of $2,500.00 upon the execution of this agreement. If Assignee",
        "fails to close, the EMD is forfeited to Assignor.",
        "",
        "5. ASSUMPTION OF DUTIES: Assignee agrees to assume and perform all duties, obligations,",
        "and responsibilities required to close the transaction with the County Trustee or LRA.",
        "",
        "IN WITNESS WHEREOF, the parties have executed this Assignment on the dates below."
    ]
    
    for line in lines:
        text.textLine(line)
        
    c.drawText(text)
    
    # Signature Blocks
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 250, "ASSIGNOR:")
    c.setFont("Helvetica", 12)
    c.drawString(50, 220, "Signature: ___________________________")
    c.drawString(50, 190, "Name: James Rodney Arms Jr., CEO")
    c.drawString(50, 160, "Company: Rodney & Sons LLC")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(350, 250, "ASSIGNEE (INVESTOR):")
    c.setFont("Helvetica", 12)
    c.drawString(350, 220, "Signature: ___________________________")
    c.drawString(350, 190, "Date: _______________________________")
    
    c.save()
    print(f"✅ MISSION COMPLETE: Official Contract generated at {path}")

if __name__ == "__main__":
    build_contract()