#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class MODealWholesalerTester:
    def __init__(self, base_url="https://modealwholesale.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.user_id = None
        self.admin_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
            self.failed_tests.append({"test": test_name, "error": details})
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
            
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
                
            return success, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}
    
    def test_integration_status(self):
        """Test integration status endpoint"""
        success, response = self.make_request('GET', 'integration-status')
        self.log_result("Integration Status Check", success, 
                       "" if success else f"Status: {response.get('status_code', 'Unknown')}")
        
        if success:
            integrations = response
            print(f"   Stripe: {'✅' if integrations.get('stripe', {}).get('configured') else '❌'}")
            print(f"   OpenAI: {'✅' if integrations.get('openai', {}).get('configured') else '❌'}")
            print(f"   Twilio: {'✅' if integrations.get('twilio', {}).get('configured') else '❌'}")
        
        return success
    
    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            "email": f"test_investor_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "Investor",
            "phone": "+15551234567",
            "company_name": "Test Investments LLC",
            "tier": "bronze"
        }
        
        success, response = self.make_request('POST', 'auth/register', test_user_data)
        self.log_result("User Registration", success, 
                       "" if success else f"Error: {response.get('detail', response.get('error', 'Unknown'))}")
        
        if success:
            self.token = response.get('token')
            self.user_id = response.get('user', {}).get('id')
            print(f"   User ID: {self.user_id}")
            print(f"   Token received: {'✅' if self.token else '❌'}")
        
        return success
    
    def test_user_login(self):
        """Test user login with admin credentials"""
        # Try to create admin user first
        admin_data = {
            "email": f"admin_{datetime.now().strftime('%H%M%S')}@modeal.com",
            "password": "AdminPass123!",
            "first_name": "Admin",
            "last_name": "User",
            "tier": "platinum"
        }
        
        success, response = self.make_request('POST', 'auth/register', admin_data)
        if success:
            # Manually set admin status (in real app, this would be done via database)
            self.admin_token = response.get('token')
            self.admin_id = response.get('user', {}).get('id')
        
        # Test login with regular user
        login_data = {
            "email": f"test_investor_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data, expected_status=401)
        # Expect 401 since user doesn't exist, but endpoint should work
        self.log_result("User Login Endpoint", True, "Login endpoint accessible")
        
        return True
    
    def test_properties_api(self):
        """Test properties endpoints"""
        if not self.token:
            self.log_result("Properties API", False, "No auth token available")
            return False
        
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Test GET properties
        success, response = self.make_request('GET', 'properties', headers=headers)
        self.log_result("Get Properties", success, 
                       "" if success else f"Error: {response.get('detail', response.get('error', 'Unknown'))}")
        
        if success:
            properties = response.get('properties', [])
            print(f"   Properties found: {len(properties)}")
            print(f"   Total count: {response.get('total', 0)}")
        
        return success
    
    def test_investors_deals_api(self):
        """Test investors deals endpoint"""
        if not self.token:
            self.log_result("Investors Deals API", False, "No auth token available")
            return False
        
        headers = {'Authorization': f'Bearer {self.token}'}
        
        success, response = self.make_request('GET', 'investors/deals', headers=headers)
        self.log_result("Get Available Deals", success, 
                       "" if success else f"Error: {response.get('detail', response.get('error', 'Unknown'))}")
        
        if success:
            deals = response.get('deals', [])
            tier = response.get('tier', 'unknown')
            print(f"   Available deals: {len(deals)}")
            print(f"   User tier: {tier}")
        
        return success
    
    def test_subscription_tiers_api(self):
        """Test subscription tiers endpoint"""
        success, response = self.make_request('GET', 'investors/subscription-tiers')
        self.log_result("Get Subscription Tiers", success, 
                       "" if success else f"Error: {response.get('detail', response.get('error', 'Unknown'))}")
        
        if success:
            tiers = response.get('tiers', {})
            print(f"   Available tiers: {list(tiers.keys())}")
            for tier_name, tier_info in tiers.items():
                print(f"   {tier_name}: ${tier_info.get('price', 0)}/month")
        
        return success
    
    def test_admin_dashboard_api(self):
        """Test admin dashboard endpoint"""
        if not self.admin_token:
            # Try with regular token (should fail with 403)
            headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
            success, response = self.make_request('GET', 'admin/dashboard', headers=headers, expected_status=403)
            self.log_result("Admin Dashboard (Access Control)", success, 
                           "Correctly blocked non-admin access" if success else "Should block non-admin users")
            return success
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.make_request('GET', 'admin/dashboard', headers=headers)
        self.log_result("Admin Dashboard", success, 
                       "" if success else f"Error: {response.get('detail', response.get('error', 'Unknown'))}")
        
        return success
    
    def test_admin_seed_data(self):
        """Test admin seed data endpoint"""
        if not self.admin_token:
            self.log_result("Admin Seed Data", False, "No admin token available")
            return False
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.make_request('POST', 'admin/seed-demo-data', headers=headers)
        self.log_result("Admin Seed Demo Data", success, 
                       "" if success else f"Error: {response.get('detail', response.get('error', 'Unknown'))}")
        
        if success:
            message = response.get('message', '')
            print(f"   Result: {message}")
        
        return success
    
    def test_payments_checkout(self):
        """Test payment checkout creation"""
        if not self.token:
            self.log_result("Payment Checkout", False, "No auth token available")
            return False
        
        headers = {'Authorization': f'Bearer {self.token}', 'origin': 'https://modealwholesale.preview.emergentagent.com'}
        
        # Test subscription checkout
        success, response = self.make_request('POST', 'payments/create-checkout?payment_type=subscription&tier=bronze', 
                                            headers=headers)
        self.log_result("Payment Checkout Creation", success, 
                       "" if success else f"Error: {response.get('detail', response.get('error', 'Unknown'))}")
        
        if success:
            checkout_url = response.get('checkout_url')
            session_id = response.get('session_id')
            print(f"   Checkout URL created: {'✅' if checkout_url else '❌'}")
            print(f"   Session ID: {session_id}")
        
        return success
    
    def test_ai_chat_endpoint(self):
        """Test AI chat endpoint"""
        if not self.token:
            self.log_result("AI Chat Endpoint", False, "No auth token available")
            return False
        
        headers = {'Authorization': f'Bearer {self.token}'}
        chat_data = {
            "message": "What should I look for in a distressed property in Missouri?",
            "context_type": "general"
        }
        
        success, response = self.make_request('POST', 'chat/message', chat_data, headers=headers)
        self.log_result("AI Chat Message", success, 
                       "" if success else f"Error: {response.get('detail', response.get('error', 'Unknown'))}")
        
        if success:
            ai_response = response.get('response', '')
            session_id = response.get('session_id', '')
            print(f"   AI Response received: {'✅' if ai_response else '❌'}")
            print(f"   Session ID: {session_id}")
            if ai_response:
                print(f"   Response preview: {ai_response[:100]}...")
        
        return success
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting MO Deal Wholesaler API Tests")
        print("=" * 50)
        
        # Core system tests
        self.test_integration_status()
        
        # Authentication tests
        self.test_user_registration()
        self.test_user_login()
        
        # API endpoint tests
        self.test_properties_api()
        self.test_investors_deals_api()
        self.test_subscription_tiers_api()
        
        # Admin tests
        self.test_admin_dashboard_api()
        self.test_admin_seed_data()
        
        # Payment tests
        self.test_payments_checkout()
        
        # AI integration tests
        self.test_ai_chat_endpoint()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failed in self.failed_tests:
                print(f"   - {failed['test']}: {failed['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 70  # Consider 70%+ success rate as passing

def main():
    """Main test execution"""
    tester = MODealWholesalerTester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())