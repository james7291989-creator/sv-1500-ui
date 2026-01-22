"""
Twilio SMS/Voice Outreach Integration Module
Missouri-Compliant Seller Contact Automation

Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env to activate
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from enum import Enum

logger = logging.getLogger(__name__)

class OutreachChannel(str, Enum):
    SMS = "sms"
    VOICE = "voice"
    EMAIL = "email"

class OutreachDay(int, Enum):
    DAY_0 = 0   # Initial contact
    DAY_2 = 2   # Follow-up if no response
    DAY_4 = 4   # Final follow-up

# Missouri-Compliant SMS Templates
SMS_TEMPLATES = {
    OutreachDay.DAY_0: """Hi {owner_first_name}, I'm interested in buying your property at {property_address} in {city}. Cash offer, as-is, no repairs needed.
Are you open to selling? — MO Deal Wholesaler""",
    
    OutreachDay.DAY_2: """I buy 3-4 properties per month in {county} County.
My offer for {property_address} is still available. Typical close in 14 days.
Reply CALL to talk or INFO for details.""",
    
    OutreachDay.DAY_4: """Final follow-up: My cash offer for {property_address} expires in 7 days.
If you're not interested, no problem — I'll remove you from my list.
Reply STOP to opt out."""
}

# Voice Script for AI or Human Calls
VOICE_SCRIPT = """
Hello, is this {owner_name}? 

Hi {owner_first_name}, this is the acquisitions team from MO Deal Wholesaler. 
I'm calling about your property at {property_address}.

We're local investors who buy properties for cash, as-is. 
We noticed your property and wanted to see if you'd be open to a cash offer.

[IF INTERESTED]
Great! I have a few quick questions to prepare your offer:

1. Are you the sole owner, or are there other parties on the title?
2. On a scale of 1-10, with 10 being move-in ready, how would you rate the condition?
3. If we could close in as fast as 7 days, would that help your situation?
4. Do you have a number in mind, or would you prefer I make an offer based on my evaluation?
5. When could we see the property? No need to clean or fix anything.

[IF NOT INTERESTED]
No problem at all. Would you like me to remove you from our list?

Thank you for your time. Have a great day!
"""


class TwilioOutreachClient:
    """Twilio SMS/Voice client for seller outreach"""
    
    def __init__(self):
        self.account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        self.auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        self.phone_number = os.environ.get('TWILIO_PHONE_NUMBER')
        self.is_configured = all([self.account_sid, self.auth_token, self.phone_number])
        self._client = None
        
    def _get_client(self):
        """Lazy load Twilio client"""
        if self._client is None and self.is_configured:
            try:
                from twilio.rest import Client
                self._client = Client(self.account_sid, self.auth_token)
            except ImportError:
                logger.error("Twilio library not installed")
                return None
        return self._client
    
    async def send_sms(
        self,
        to_phone: str,
        property_data: Dict[str, Any],
        day: OutreachDay = OutreachDay.DAY_0
    ) -> Dict[str, Any]:
        """
        Send SMS to property owner
        
        Args:
            to_phone: Owner phone number (E.164 format: +15551234567)
            property_data: Dict with owner_first_name, property_address, city, county
            day: Which day in the outreach sequence
        """
        if not self.is_configured:
            return {
                "status": "not_configured",
                "message": "Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to .env"
            }
        
        client = self._get_client()
        if not client:
            return {"status": "error", "message": "Failed to initialize Twilio client"}
        
        # Format message with property data
        template = SMS_TEMPLATES.get(day, SMS_TEMPLATES[OutreachDay.DAY_0])
        message_body = template.format(**property_data)
        
        try:
            message = client.messages.create(
                body=message_body,
                from_=self.phone_number,
                to=to_phone
            )
            
            logger.info(f"SMS sent to {to_phone}: {message.sid}")
            
            return {
                "status": "success",
                "sid": message.sid,
                "to": to_phone,
                "message": message_body,
                "sent_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"SMS send error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def initiate_voice_call(
        self,
        to_phone: str,
        property_data: Dict[str, Any],
        use_ai_voice: bool = True
    ) -> Dict[str, Any]:
        """
        Initiate voice call to property owner
        
        Args:
            to_phone: Owner phone number
            property_data: Dict with owner info
            use_ai_voice: Use AI synthesized voice (True) or connect to human (False)
        """
        if not self.is_configured:
            return {
                "status": "not_configured",
                "message": "Twilio not configured"
            }
        
        client = self._get_client()
        if not client:
            return {"status": "error", "message": "Failed to initialize Twilio client"}
        
        # TwiML URL for call handling
        webhook_url = os.environ.get('TWILIO_VOICE_WEBHOOK_URL', '')
        
        if not webhook_url:
            return {
                "status": "not_configured",
                "message": "TWILIO_VOICE_WEBHOOK_URL not configured"
            }
        
        try:
            call = client.calls.create(
                to=to_phone,
                from_=self.phone_number,
                url=f"{webhook_url}?property_id={property_data.get('property_id')}&ai_voice={use_ai_voice}"
            )
            
            logger.info(f"Call initiated to {to_phone}: {call.sid}")
            
            return {
                "status": "success",
                "sid": call.sid,
                "to": to_phone,
                "initiated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Voice call error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def create_outreach_campaign(
        self,
        properties: List[Dict[str, Any]],
        channels: List[OutreachChannel] = [OutreachChannel.SMS]
    ) -> Dict[str, Any]:
        """
        Create multi-day outreach campaign for list of properties
        
        Returns campaign plan with scheduled messages
        """
        campaign = {
            "id": f"campaign_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "total_properties": len(properties),
            "channels": [c.value for c in channels],
            "schedule": []
        }
        
        for prop in properties:
            owner_phone = prop.get("owner_phone")
            if not owner_phone:
                continue
            
            # Schedule Day 0, 2, 4 messages
            for day in [OutreachDay.DAY_0, OutreachDay.DAY_2, OutreachDay.DAY_4]:
                scheduled_date = datetime.now(timezone.utc) + timedelta(days=day.value)
                
                campaign["schedule"].append({
                    "property_id": prop.get("id"),
                    "property_address": prop.get("address"),
                    "owner_phone": owner_phone,
                    "owner_name": prop.get("owner_name"),
                    "channel": OutreachChannel.SMS.value,
                    "day": day.value,
                    "scheduled_at": scheduled_date.isoformat(),
                    "status": "pending"
                })
        
        return campaign
    
    def handle_incoming_sms(self, from_phone: str, body: str) -> Dict[str, Any]:
        """
        Handle incoming SMS responses
        
        Keywords:
        - CALL: Schedule callback
        - INFO: Send property details
        - STOP: Remove from list (TCPA compliance)
        """
        body_upper = body.upper().strip()
        
        if "STOP" in body_upper or "UNSUBSCRIBE" in body_upper:
            return {
                "action": "opt_out",
                "response": "You've been removed from our list. Reply START to re-subscribe.",
                "update_database": True,
                "opt_out": True
            }
        
        if "CALL" in body_upper:
            return {
                "action": "schedule_callback",
                "response": "Great! Our acquisitions manager will call you within 2 hours. What time works best?",
                "update_database": True,
                "callback_requested": True
            }
        
        if "INFO" in body_upper:
            return {
                "action": "send_info",
                "response": "Thanks for your interest! I'll send you a detailed offer breakdown shortly. What's the best email to reach you?",
                "update_database": True,
                "info_requested": True
            }
        
        # Any other response indicates engagement
        return {
            "action": "engaged",
            "response": "Thanks for getting back to me! Are you open to a quick 5-minute call to discuss the property?",
            "update_database": True,
            "engaged": True
        }


# Singleton instance
twilio_client = TwilioOutreachClient()
