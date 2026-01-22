"""
PropStream API Integration Module
Missouri Distressed Property Data Service

Configure PROPSTREAM_API_KEY in .env to activate
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import httpx

logger = logging.getLogger(__name__)

# PropStream API Configuration
PROPSTREAM_BASE_URL = "https://api.propstream.com/v1"

# Missouri Top Counties by Volume
MISSOURI_COUNTIES = [
    "Jackson",      # Kansas City
    "St. Louis",    # St. Louis metro
    "Greene",       # Springfield
    "Boone",        # Columbia
    "Clay",         # KC North
    "St. Charles",  # St. Louis suburb
    "Jefferson",    # Arnold/Festus
    "Jasper",       # Joplin
    "Cole",         # Jefferson City
    "Cape Girardeau"
]

class PropStreamClient:
    """PropStream API client for Missouri property data"""
    
    def __init__(self):
        self.api_key = os.environ.get('PROPSTREAM_API_KEY')
        self.is_configured = bool(self.api_key)
        
    async def search_distressed_properties(
        self,
        counties: List[str] = None,
        min_equity_percent: int = 30,
        property_types: List[str] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Search for distressed properties in Missouri
        
        Returns properties matching distress signals:
        - Tax delinquent
        - Vacant
        - Lis pendens (foreclosure filing)
        - Code violations
        - Probate filing
        - Tax lien sale
        """
        if not self.is_configured:
            return {
                "status": "not_configured",
                "message": "PropStream API key not configured. Add PROPSTREAM_API_KEY to .env",
                "properties": []
            }
        
        search_params = {
            "state": "MO",
            "counties": counties or MISSOURI_COUNTIES[:5],
            "filters": {
                "tax_delinquent": True,
                "vacancy_indicators": True,
                "owner_occupied": False,
                "equity_estimate_min": min_equity_percent,
                "property_types": property_types or ["single_family", "multi_family", "land"]
            },
            "distress_signals": [
                "lis_pendens",
                "code_violations",
                "probate_filing",
                "tax_lien_sale"
            ],
            "limit": limit
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{PROPSTREAM_BASE_URL}/properties/search",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=search_params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "status": "success",
                    "total": data.get("total", 0),
                    "properties": self._transform_properties(data.get("properties", []))
                }
                
        except httpx.HTTPError as e:
            logger.error(f"PropStream API error: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "properties": []
            }
    
    async def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """Get detailed property information including owner data"""
        if not self.is_configured:
            return {"status": "not_configured", "message": "PropStream API key required"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{PROPSTREAM_BASE_URL}/properties/{property_id}",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=30.0
                )
                response.raise_for_status()
                return {"status": "success", "property": response.json()}
                
        except httpx.HTTPError as e:
            logger.error(f"PropStream property detail error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def skip_trace_owner(self, property_id: str) -> Dict[str, Any]:
        """
        Skip trace property owner to get contact information
        Cost: ~$0.12-0.15 per record
        """
        if not self.is_configured:
            return {"status": "not_configured", "message": "PropStream API key required"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{PROPSTREAM_BASE_URL}/skip-trace",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={"property_id": property_id},
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "status": "success",
                    "owner": {
                        "name": data.get("owner_name"),
                        "phones": data.get("phone_numbers", []),
                        "emails": data.get("email_addresses", []),
                        "mailing_address": data.get("mailing_address"),
                        "relatives": data.get("relatives", []),
                        "social_profiles": data.get("social_profiles", [])
                    }
                }
                
        except httpx.HTTPError as e:
            logger.error(f"Skip trace error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def _transform_properties(self, properties: List[Dict]) -> List[Dict]:
        """Transform PropStream data to platform format"""
        transformed = []
        for prop in properties:
            transformed.append({
                "external_id": prop.get("id"),
                "address": prop.get("address", {}).get("street"),
                "city": prop.get("address", {}).get("city"),
                "state": "MO",
                "zip_code": prop.get("address", {}).get("zip"),
                "county": prop.get("address", {}).get("county"),
                "property_type": prop.get("property_type", "single_family"),
                "bedrooms": prop.get("bedrooms"),
                "bathrooms": prop.get("bathrooms"),
                "sqft": prop.get("living_area"),
                "lot_size": prop.get("lot_size_acres"),
                "year_built": prop.get("year_built"),
                "owner_name": prop.get("owner", {}).get("name"),
                "owner_address": prop.get("owner", {}).get("mailing_address"),
                "assessed_value": prop.get("assessed_value"),
                "estimated_arv": prop.get("estimated_value"),
                "tax_delinquency_years": prop.get("tax_delinquent_years", 0),
                "tax_delinquency_amount": prop.get("tax_amount_due", 0),
                "vacancy_indicators": prop.get("vacancy_indicators", []),
                "code_violations": prop.get("code_violations", []),
                "liens": prop.get("liens", []),
                "distress_signals": prop.get("distress_signals", []),
                "last_sale_date": prop.get("last_sale_date"),
                "last_sale_price": prop.get("last_sale_price")
            })
        return transformed


# Singleton instance
propstream_client = PropStreamClient()
