"""
Orders Management API for PayU Payment Integration
Handles order creation, status updates, and payment processing
"""

import json
import os
import hashlib
import hmac
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any, Optional
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS Headers
def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
    }

# Supabase Configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# Import configs
try:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from config.app_config import get_payu_config, get_payment_config
    PAYU_CONFIG = get_payu_config()
    PAYMENT_CONFIG = get_payment_config()
except ImportError as e:
    logger.warning(f"Config import failed: {e}, using fallback config")
    PAYU_CONFIG = {
        'merchant_id': 'TEST_MID',
        'salt': 'TEST_SALT',
        'base_url': 'https://test.payu.in',
        'amount': 99.00,
        'currency': 'INR',
        'product_info': 'BestCVBuilder - ATS Resume Optimization'
    }
    PAYMENT_CONFIG = {'bypass_payment': False}

def extract_contact_info_from_resume(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract email addresses and phone numbers from resume analysis data
    """
    try:
        contact_info = {
            'emails': [],
            'phone_numbers': [],
            'primary_email': '',
            'primary_phone': ''
        }
        
        # Get resume content
        content = analysis_data.get('content', '')
        personal_info = analysis_data.get('personal_information', {})
        
        # Extract emails using regex
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = list(set(re.findall(email_pattern, content, re.IGNORECASE)))
        contact_info['emails'] = emails
        contact_info['primary_email'] = emails[0] if emails else ''
        
        # Extract phone numbers using multiple patterns
        phone_patterns = [
            r'\+91[-.\s]?\d{10}',  # +91-9999999999
            r'\+91\s?\d{10}',      # +91 9999999999
            r'\d{10}',             # 9999999999
            r'\d{3}[-.\s]\d{3}[-.\s]\d{4}',  # 999-999-9999
            r'\(\d{3}\)\s?\d{3}[-.\s]\d{4}', # (999) 999-9999
        ]
        
        phone_numbers = []
        for pattern in phone_patterns:
            matches = re.findall(pattern, content)
            phone_numbers.extend(matches)
        
        # Clean and deduplicate phone numbers
        cleaned_phones = []
        for phone in phone_numbers:
            # Remove special characters and spaces
            clean_phone = re.sub(r'[^\d+]', '', phone)
            if len(clean_phone) >= 10 and clean_phone not in cleaned_phones:
                cleaned_phones.append(phone.strip())  # Keep original format for display
        
        contact_info['phone_numbers'] = cleaned_phones[:5]  # Limit to 5 numbers
        contact_info['primary_phone'] = cleaned_phones[0] if cleaned_phones else ''
        
        # Try to get from personal_info if available
        if personal_info:
            if 'email' in personal_info and personal_info['email']:
                contact_info['primary_email'] = personal_info['email']
                if personal_info['email'] not in contact_info['emails']:
                    contact_info['emails'].insert(0, personal_info['email'])
            
            if 'phone' in personal_info and personal_info['phone']:
                contact_info['primary_phone'] = personal_info['phone']
                if personal_info['phone'] not in contact_info['phone_numbers']:
                    contact_info['phone_numbers'].insert(0, personal_info['phone'])
        
        logger.info(f"Extracted contact info: {len(contact_info['emails'])} emails, {len(contact_info['phone_numbers'])} phones")
        return contact_info
        
    except Exception as e:
        logger.error(f"Error extracting contact info: {str(e)}")
        return {
            'emails': [],
            'phone_numbers': [],
            'primary_email': '',
            'primary_phone': ''
        }

def generate_order_id() -> str:
    """Generate unique order ID in format BCVB_YYYYMMDD_NNNNNN"""
    try:
        now = datetime.now(timezone.utc)
        date_part = now.strftime('%Y%m%d')
        
        # Generate a 6-digit random number
        import random
        random_part = random.randint(100000, 999999)
        
        order_id = f"BCVB_{date_part}_{random_part}"
        return order_id
    except Exception as e:
        logger.error(f"Error generating order ID: {str(e)}")
        # Fallback to UUID-based ID
        return f"BCVB_{uuid.uuid4().hex[:12].upper()}"

def create_order_in_database(order_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create order in Supabase database"""
    try:
        import requests
        
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise Exception("Supabase configuration missing")
        
        # Prepare order data
        db_order = {
            'order_id': order_data['order_id'],
            'order_email': order_data['email'],
            'order_mobile': order_data['phone'],
            'order_amount': float(PAYU_CONFIG['amount']),
            'order_currency': PAYU_CONFIG['currency'],
            'order_status': 'PENDING',
            'analysis_data': order_data.get('analysis_data', {}),
            'user_id': order_data.get('user_id'),  # Will be null for anonymous users
        }
        
        # Insert into Supabase
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/orders",
            json=db_order,
            headers={
                'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
                'apikey': SUPABASE_SERVICE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            timeout=10
        )
        
        if response.status_code == 201:
            created_order = response.json()[0] if response.json() else {}
            logger.info(f"✅ Order created in database: {order_data['order_id']}")
            return created_order
        else:
            logger.error(f"Failed to create order: {response.status_code} - {response.text}")
            raise Exception(f"Database error: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error creating order in database: {str(e)}")
        # For development, create a mock order
        return {
            'id': str(uuid.uuid4()),
            'order_id': order_data['order_id'],
            'order_email': order_data['email'],
            'order_mobile': order_data['phone'],
            'order_amount': PAYU_CONFIG['amount'],
            'order_status': 'PENDING',
            'created_at': datetime.now(timezone.utc).isoformat()
        }

def generate_payu_hash(data: Dict[str, str]) -> str:
    """Generate PayU payment hash"""
    try:
        # PayU hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
        hash_string = (
            f"{data['key']}|{data['txnid']}|{data['amount']}|{data['productinfo']}|"
            f"{data['firstname']}|{data['email']}|||||||||||{PAYU_CONFIG['salt']}"
        )
        
        # Generate SHA512 hash
        hash_value = hashlib.sha512(hash_string.encode('utf-8')).hexdigest()
        logger.info(f"Generated PayU hash for transaction: {data['txnid']}")
        return hash_value
        
    except Exception as e:
        logger.error(f"Error generating PayU hash: {str(e)}")
        raise Exception(f"Hash generation failed: {str(e)}")

def prepare_payu_payment_data(order: Dict[str, Any]) -> Dict[str, str]:
    """Prepare payment data for PayU"""
    try:
        # Get base URL for PayU callback URLs
        base_url = 'https://bestcvbuilder-frontend.onrender.com'
        
        payment_data = {
            'key': PAYU_CONFIG['merchant_id'],
            'txnid': order['order_id'],
            'amount': str(PAYU_CONFIG['amount']),
            'productinfo': PAYU_CONFIG['product_info'],
            'firstname': order['order_email'].split('@')[0],  # Use email prefix as name
            'email': order['order_email'],
            'phone': order['order_mobile'],
            'surl': f"{base_url}/payment-success",
            'furl': f"{base_url}/payment-failure",
            'curl': f"{base_url}/payment-cancel",
            'service_provider': PAYU_CONFIG.get('service_provider', 'payu_paisa'),
        }
        
        # Generate hash
        payment_data['hash'] = generate_payu_hash(payment_data)
        
        return payment_data
        
    except Exception as e:
        logger.error(f"Error preparing PayU payment data: {str(e)}")
        raise Exception(f"Payment preparation failed: {str(e)}")

class handler(BaseHTTPRequestHandler):
    """Orders API Handler"""
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        for key, value in cors_headers().items():
            self.send_header(key.replace('_', '-'), value)
        self.end_headers()
    
    def do_POST(self):
        """Handle order creation and payment initiation"""
        try:
            # Parse request path
            parsed_path = urlparse(self.path)
            path = parsed_path.path
            
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length:
                body = self.rfile.read(content_length)
                try:
                    request_data = json.loads(body.decode('utf-8'))
                except json.JSONDecodeError:
                    self.send_error_response({'error': 'Invalid JSON'}, 400)
                    return
            else:
                request_data = {}
            
            if path == '/create-order' or path == '/api/orders/create-order':
                self.handle_create_order(request_data)
            elif path == '/initiate-payment' or path == '/api/orders/initiate-payment':
                self.handle_initiate_payment(request_data)
            else:
                self.send_error_response({'error': 'Endpoint not found'}, 404)
                
        except Exception as e:
            logger.error(f"POST request error: {str(e)}")
            self.send_error_response({'error': 'Internal server error'}, 500)
    
    def handle_create_order(self, request_data: Dict[str, Any]):
        """Handle order creation with contact extraction"""
        try:
            # Validate required fields
            if 'analysis_data' not in request_data:
                self.send_error_response({'error': 'Analysis data is required'}, 400)
                return
            
            # Extract contact information from resume
            analysis_data = request_data['analysis_data']
            contact_info = extract_contact_info_from_resume(analysis_data)
            
            # Generate order ID
            order_id = generate_order_id()
            
            # Create order data
            order_data = {
                'order_id': order_id,
                'email': request_data.get('email', contact_info['primary_email']),
                'phone': request_data.get('phone', contact_info['primary_phone']),
                'analysis_data': analysis_data,
                'user_id': request_data.get('user_id')
            }
            
            # Create order in database
            created_order = create_order_in_database(order_data)
            
            # Prepare response
            response_data = {
                'success': True,
                'order': created_order,
                'contact_info': contact_info,
                'amount': PAYU_CONFIG['amount'],
                'currency': PAYU_CONFIG['currency']
            }
            
            self.send_success_response(response_data)
            
        except Exception as e:
            logger.error(f"Create order error: {str(e)}")
            self.send_error_response({'error': f'Order creation failed: {str(e)}'}, 500)
    
    def handle_initiate_payment(self, request_data: Dict[str, Any]):
        """Handle PayU payment initiation"""
        try:
            # Validate required fields
            required_fields = ['order_id', 'email', 'phone']
            for field in required_fields:
                if field not in request_data or not request_data[field]:
                    self.send_error_response({'error': f'{field} is required'}, 400)
                    return
            
            # Prepare order data for PayU
            order_data = {
                'order_id': request_data['order_id'],
                'order_email': request_data['email'],
                'order_mobile': request_data['phone']
            }
            
            # Generate PayU payment data
            payment_data = prepare_payu_payment_data(order_data)
            
            # Prepare response
            response_data = {
                'success': True,
                'payment_data': payment_data,
                'payu_url': PAYU_CONFIG['base_url'] + '/_payment',
                'order_id': request_data['order_id']
            }
            
            self.send_success_response(response_data)
            
        except Exception as e:
            logger.error(f"Payment initiation error: {str(e)}")
            self.send_error_response({'error': f'Payment initiation failed: {str(e)}'}, 500)
    
    def do_GET(self):
        """Handle GET requests for order status"""
        try:
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            
            if parsed_path.path.startswith('/order/'):
                order_id = parsed_path.path.split('/')[-1]
                self.handle_get_order(order_id)
            else:
                self.send_error_response({'error': 'Invalid endpoint'}, 404)
                
        except Exception as e:
            logger.error(f"GET request error: {str(e)}")
            self.send_error_response({'error': 'Internal server error'}, 500)
    
    def handle_get_order(self, order_id: str):
        """Get order details by ID"""
        try:
            import requests
            
            if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
                raise Exception("Supabase configuration missing")
            
            # Query order from database
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/orders",
                params={'order_id': f'eq.{order_id}'},
                headers={
                    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
                    'apikey': SUPABASE_SERVICE_KEY,
                },
                timeout=10
            )
            
            if response.status_code == 200:
                orders = response.json()
                if orders:
                    self.send_success_response({'order': orders[0]})
                else:
                    self.send_error_response({'error': 'Order not found'}, 404)
            else:
                self.send_error_response({'error': 'Database error'}, 500)
                
        except Exception as e:
            logger.error(f"Get order error: {str(e)}")
            self.send_error_response({'error': 'Failed to fetch order'}, 500)
    
    def send_success_response(self, data: Dict[str, Any]):
        """Send success response"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        for key, value in cors_headers().items():
            self.send_header(key.replace('_', '-'), value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def send_error_response(self, error_data: Dict[str, str], status_code: int):
        """Send error response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        for key, value in cors_headers().items():
            self.send_header(key.replace('_', '-'), value)
        self.end_headers()
        self.wfile.write(json.dumps(error_data).encode('utf-8'))

# For local testing
if __name__ == "__main__":
    print("Orders API is running...")
    print("Available endpoints:")
    print("POST /create-order - Create new order with contact extraction")
    print("POST /initiate-payment - Initiate PayU payment")
    print("GET /order/{order_id} - Get order details")