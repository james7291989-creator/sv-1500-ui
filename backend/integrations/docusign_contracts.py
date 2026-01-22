"""
DocuSign E-Signature Integration Module
Missouri Real Estate Contract Templates

Configure DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID in .env to activate
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import base64

logger = logging.getLogger(__name__)

# Missouri-Specific Contract Templates
CONTRACT_TEMPLATES = {
    "purchase_agreement": {
        "name": "Missouri Real Estate Purchase Agreement",
        "description": "Assignable purchase agreement for Missouri property acquisition",
        "fields": [
            {"name": "seller_name", "label": "Seller Name", "required": True, "auto_populate": "propstream"},
            {"name": "seller_address", "label": "Seller Address", "required": True},
            {"name": "seller_phone", "label": "Seller Phone", "required": False},
            {"name": "seller_email", "label": "Seller Email", "required": False},
            {"name": "property_address", "label": "Property Address", "required": True, "auto_populate": "county"},
            {"name": "legal_description", "label": "Legal Description", "required": True},
            {"name": "purchase_price", "label": "Purchase Price", "required": True, "editable": True},
            {"name": "earnest_money", "label": "Earnest Money Deposit", "required": True, "default": "500"},
            {"name": "inspection_days", "label": "Inspection Period (Days)", "required": True, "default": "10"},
            {"name": "closing_days", "label": "Days to Close", "required": True, "default": "21"},
            {"name": "closing_date", "label": "Closing Date", "required": True, "auto_calculate": True},
            {"name": "assignment_clause", "label": "Assignment Rights", "required": True, "locked": True, 
             "value": "CHECKED - Purchaser may assign all rights to third-party without seller consent"},
            {"name": "as_is_clause", "label": "As-Is Condition", "required": True, "locked": True},
        ],
        "signatures": [
            {"role": "seller", "name": "Seller Signature", "required": True},
            {"role": "platform", "name": "MO Deal Wholesaler LLC", "required": True, "auto_sign": True}
        ],
        "disclosures": [
            "lead_based_paint",  # Required for pre-1978 properties
            "seller_disclosure",
            "no_representation"   # We are not their agent
        ]
    },
    "assignment_agreement": {
        "name": "Missouri Assignment of Contract",
        "description": "Assignment of purchase agreement rights to investor-buyer",
        "fields": [
            {"name": "assignor", "label": "Assignor (MO Deal Wholesaler)", "required": True, "locked": True},
            {"name": "assignee_name", "label": "Investor Buyer Name", "required": True},
            {"name": "assignee_company", "label": "Investor Company", "required": False},
            {"name": "assignee_email", "label": "Investor Email", "required": True},
            {"name": "property_address", "label": "Property Address", "required": True},
            {"name": "original_purchase_price", "label": "Original Contract Price", "required": True, "locked": True},
            {"name": "assignment_price", "label": "Assignment Price to Investor", "required": True},
            {"name": "assignment_fee", "label": "Assignment Fee", "required": True, "auto_calculate": True},
            {"name": "coordination_fee", "label": "Coordination Fee", "required": True, "default": "795", "locked": True},
            {"name": "total_due", "label": "Total Due at Closing", "required": True, "auto_calculate": True},
            {"name": "emd_amount", "label": "EMD Required", "required": True, "auto_calculate": True},
            {"name": "emd_due_date", "label": "EMD Due Within", "required": True, "default": "48 hours"},
        ],
        "signatures": [
            {"role": "assignor", "name": "MO Deal Wholesaler LLC (Assignor)", "required": True, "auto_sign": True},
            {"role": "assignee", "name": "Investor Buyer (Assignee)", "required": True}
        ],
        "fee_disclosure": True  # Assignment fee clearly shown (Missouri best practice)
    }
}

# Missouri Required Disclosures
MISSOURI_DISCLOSURES = {
    "lead_based_paint": {
        "title": "Lead-Based Paint Disclosure",
        "required_for": "properties built before 1978",
        "text": """LEAD WARNING STATEMENT: Housing built before 1978 may contain lead-based paint. 
Lead from paint, paint chips, and dust can pose health hazards if not managed properly. 
Lead exposure is especially harmful to young children and pregnant women."""
    },
    "seller_disclosure": {
        "title": "Missouri Seller's Disclosure Statement",
        "required_for": "all residential transactions",
        "text": """As required by RSMo 442.606, Seller shall complete a Seller's Disclosure 
Statement regarding the condition of the Property, including known defects."""
    },
    "no_representation": {
        "title": "No Agency Relationship Disclosure",
        "required_for": "wholesale transactions",
        "text": """DISCLOSURE: MO Deal Wholesaler LLC is a real estate investor purchasing 
property for its own account. We are NOT a licensed real estate agent or broker 
representing your interests. We may resell this property for profit. You may seek 
independent legal advice before signing this agreement."""
    },
    "mold_disclosure": {
        "title": "Mold Disclosure",
        "required_for": "if known",
        "text": """Seller discloses any known presence of mold or conditions that may 
cause mold growth on the property."""
    },
    "meth_lab_disclosure": {
        "title": "Methamphetamine Contamination Disclosure",
        "required_for": "if known (RSMo 442.606)",
        "text": """Seller discloses whether the property has been used in the 
production of methamphetamine, if known."""
    }
}


class DocuSignClient:
    """DocuSign e-signature client for contract execution"""
    
    def __init__(self):
        self.integration_key = os.environ.get('DOCUSIGN_INTEGRATION_KEY')
        self.user_id = os.environ.get('DOCUSIGN_USER_ID')
        self.account_id = os.environ.get('DOCUSIGN_ACCOUNT_ID')
        self.base_url = os.environ.get('DOCUSIGN_BASE_URL', 'https://demo.docusign.net/restapi')
        self.is_configured = all([self.integration_key, self.user_id, self.account_id])
        self._access_token = None
    
    async def create_envelope(
        self,
        template_type: str,
        contract_data: Dict[str, Any],
        signers: List[Dict[str, str]],
        property_year_built: int = None
    ) -> Dict[str, Any]:
        """
        Create DocuSign envelope for contract signing
        
        Args:
            template_type: "purchase_agreement" or "assignment_agreement"
            contract_data: Dict with all contract field values
            signers: List of {email, name, role}
            property_year_built: For lead paint disclosure requirement
        """
        if not self.is_configured:
            return {
                "status": "not_configured",
                "message": "DocuSign not configured. Add DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID to .env"
            }
        
        template = CONTRACT_TEMPLATES.get(template_type)
        if not template:
            return {"status": "error", "message": f"Unknown template type: {template_type}"}
        
        # Determine required disclosures
        disclosures = []
        if template_type == "purchase_agreement":
            disclosures.append(MISSOURI_DISCLOSURES["no_representation"])
            disclosures.append(MISSOURI_DISCLOSURES["seller_disclosure"])
            
            # Lead paint for pre-1978
            if property_year_built and property_year_built < 1978:
                disclosures.append(MISSOURI_DISCLOSURES["lead_based_paint"])
        
        # Build envelope definition
        envelope_definition = {
            "emailSubject": f"MO Deal Wholesaler - {template['name']}",
            "emailBlurb": f"Please review and sign the {template['name']} for {contract_data.get('property_address', 'Property')}",
            "status": "sent",
            "documents": [
                {
                    "documentId": "1",
                    "name": template["name"],
                    "fileExtension": "pdf",
                    # In production, generate PDF from template with contract_data
                }
            ],
            "recipients": {
                "signers": []
            }
        }
        
        # Add signers
        for i, signer in enumerate(signers, 1):
            envelope_definition["recipients"]["signers"].append({
                "email": signer["email"],
                "name": signer["name"],
                "recipientId": str(i),
                "routingOrder": str(i),
                "tabs": {
                    "signHereTabs": [
                        {"documentId": "1", "pageNumber": "1", "xPosition": "100", "yPosition": "700"}
                    ],
                    "dateSignedTabs": [
                        {"documentId": "1", "pageNumber": "1", "xPosition": "300", "yPosition": "700"}
                    ]
                }
            })
        
        # In production, make actual API call to DocuSign
        # For now, return structured response
        return {
            "status": "ready",
            "message": "DocuSign envelope prepared - API call would be made with credentials",
            "envelope_definition": envelope_definition,
            "disclosures_included": [d["title"] for d in disclosures],
            "template_used": template_type,
            "contract_data": contract_data
        }
    
    async def get_signing_url(
        self,
        envelope_id: str,
        signer_email: str,
        return_url: str
    ) -> Dict[str, Any]:
        """Get embedded signing URL for signer"""
        if not self.is_configured:
            return {"status": "not_configured", "message": "DocuSign not configured"}
        
        # In production, make API call to get signing URL
        return {
            "status": "ready",
            "message": "Would generate embedded signing URL",
            "envelope_id": envelope_id,
            "signer_email": signer_email,
            "return_url": return_url
        }
    
    async def get_envelope_status(self, envelope_id: str) -> Dict[str, Any]:
        """Check envelope/signing status"""
        if not self.is_configured:
            return {"status": "not_configured", "message": "DocuSign not configured"}
        
        # In production, check actual envelope status
        return {
            "status": "ready",
            "message": "Would check envelope status",
            "envelope_id": envelope_id
        }
    
    async def download_signed_document(self, envelope_id: str) -> Dict[str, Any]:
        """Download completed signed document"""
        if not self.is_configured:
            return {"status": "not_configured", "message": "DocuSign not configured"}
        
        return {
            "status": "ready",
            "message": "Would download signed PDF",
            "envelope_id": envelope_id
        }
    
    def calculate_assignment_fee(
        self,
        contracted_price: float,
        investor_price: float
    ) -> Dict[str, float]:
        """
        Calculate assignment fee per platform rules:
        - $10,000 flat OR 15% of investor price (whichever higher)
        - Minimum $5,000
        - Plus $795 coordination fee
        """
        spread = investor_price - contracted_price
        percentage_fee = investor_price * 0.15
        flat_fee = 10000
        
        assignment_fee = max(flat_fee, percentage_fee, 5000)
        coordination_fee = 795
        
        # EMD = 50% of assignment fee or $2,500 minimum
        emd_required = max(assignment_fee * 0.5, 2500)
        
        return {
            "assignment_fee": assignment_fee,
            "coordination_fee": coordination_fee,
            "total_fees": assignment_fee + coordination_fee,
            "emd_required": emd_required,
            "investor_total": investor_price + coordination_fee
        }


# Singleton instance
docusign_client = DocuSignClient()
