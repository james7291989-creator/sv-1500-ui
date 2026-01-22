"""
Notarize.com Remote Online Notarization Integration
Missouri RON-Compliant Deed Notarization

Configure NOTARIZE_API_KEY in .env to activate
Missouri allows Remote Online Notarization (RON) since 2020
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Missouri RON Requirements
MISSOURI_RON_REQUIREMENTS = {
    "enabled_since": "2020",
    "statute": "RSMo 486.1100-486.1205",
    "requirements": [
        "Live video conference with commissioned Missouri notary",
        "Identity verification via knowledge-based authentication (KBA)",
        "Credential analysis (government-issued ID)",
        "Audio-video recording of entire session (retained 10 years)",
        "Digital certificate attached to notarized document"
    ],
    "accepted_documents": [
        "Warranty Deed",
        "Quitclaim Deed", 
        "Deed of Trust",
        "Affidavit",
        "Power of Attorney",
        "Contract assignments"
    ]
}


class NotarizeClient:
    """Notarize.com API client for remote online notarization"""
    
    def __init__(self):
        self.api_key = os.environ.get('NOTARIZE_API_KEY')
        self.base_url = "https://api.notarize.com/v1"
        self.is_configured = bool(self.api_key)
        self.webhook_url = os.environ.get('NOTARIZE_WEBHOOK_URL', '')
    
    async def create_notarization_session(
        self,
        document_type: str,
        signer_info: Dict[str, str],
        document_url: str,
        property_address: str,
        callback_url: str = None
    ) -> Dict[str, Any]:
        """
        Create remote notarization session
        
        Args:
            document_type: "warranty_deed", "quitclaim_deed", "affidavit", etc.
            signer_info: {name, email, phone}
            document_url: URL to document requiring notarization
            property_address: Property address for session context
            callback_url: Webhook URL for completion notification
        
        Cost: ~$25 per notarization
        """
        if not self.is_configured:
            return {
                "status": "not_configured",
                "message": "Notarize.com not configured. Add NOTARIZE_API_KEY to .env",
                "instructions": [
                    "1. Go to notarize.com/business",
                    "2. Schedule sales call with integrations team",
                    "3. Complete API agreement",
                    "4. Receive API key (1-2 weeks)"
                ]
            }
        
        # Validate document type
        valid_types = ["warranty_deed", "quitclaim_deed", "deed_of_trust", 
                       "affidavit", "power_of_attorney", "contract_assignment"]
        if document_type not in valid_types:
            return {"status": "error", "message": f"Invalid document type. Must be one of: {valid_types}"}
        
        # Prepare session request
        session_request = {
            "document_type": document_type,
            "state": "MO",  # Missouri
            "signer": {
                "name": signer_info.get("name"),
                "email": signer_info.get("email"),
                "phone": signer_info.get("phone")
            },
            "document_url": document_url,
            "metadata": {
                "property_address": property_address,
                "platform": "MO Deal Wholesaler",
                "transaction_type": "wholesale_closing"
            },
            "callback_url": callback_url or self.webhook_url,
            "ron_compliant": True,
            "identity_verification": {
                "kba_required": True,
                "credential_analysis": True
            }
        }
        
        # In production, make actual API call
        # For now, return structured response showing what would happen
        return {
            "status": "ready",
            "message": "Notarization session prepared - API call would be made with credentials",
            "session_request": session_request,
            "missouri_requirements": MISSOURI_RON_REQUIREMENTS["requirements"],
            "estimated_cost": "$25",
            "estimated_duration": "15-20 minutes",
            "workflow": [
                "1. Signer receives SMS/email with session link",
                "2. Signer joins live video with Missouri notary",
                "3. Identity verification via KBA + ID check",
                "4. Document review and electronic signature",
                "5. Notary applies digital seal",
                "6. Notarized document returned to platform",
                "7. Platform notified via webhook"
            ]
        }
    
    async def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """Check notarization session status"""
        if not self.is_configured:
            return {"status": "not_configured", "message": "Notarize.com not configured"}
        
        # Possible statuses
        statuses = {
            "pending": "Waiting for signer to join",
            "in_progress": "Notarization session active",
            "completed": "Document notarized successfully",
            "failed": "Session failed - identity verification issue",
            "cancelled": "Session cancelled by signer or notary"
        }
        
        return {
            "status": "ready",
            "message": "Would check session status",
            "session_id": session_id,
            "possible_statuses": statuses
        }
    
    async def download_notarized_document(self, session_id: str) -> Dict[str, Any]:
        """Download completed notarized document"""
        if not self.is_configured:
            return {"status": "not_configured", "message": "Notarize.com not configured"}
        
        return {
            "status": "ready",
            "message": "Would download notarized PDF with digital certificate",
            "session_id": session_id,
            "includes": [
                "Digital notary seal",
                "Timestamp",
                "Notary commission info",
                "Video recording ID (for audit)"
            ]
        }
    
    def handle_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle Notarize.com webhook callback
        
        Events:
        - session.completed: Notarization successful
        - session.failed: Verification failed
        - session.cancelled: Session cancelled
        - document.ready: Signed document available for download
        """
        event_type = payload.get("event")
        session_id = payload.get("session_id")
        
        if event_type == "session.completed":
            return {
                "action": "update_closing",
                "session_id": session_id,
                "status": "notarized",
                "next_step": "Notify title company - ready to fund",
                "message": "Notarization complete — ready to close"
            }
        
        if event_type == "session.failed":
            return {
                "action": "alert_admin",
                "session_id": session_id,
                "status": "failed",
                "reason": payload.get("failure_reason"),
                "next_step": "Contact signer to reschedule",
                "message": "Notarization failed — manual follow-up required"
            }
        
        if event_type == "document.ready":
            return {
                "action": "download_document",
                "session_id": session_id,
                "document_url": payload.get("document_url"),
                "next_step": "Forward to title company",
                "message": "Notarized document ready for download"
            }
        
        return {"action": "unknown", "event": event_type}


# Singleton instance  
notarize_client = NotarizeClient()
