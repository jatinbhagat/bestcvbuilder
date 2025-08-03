"""
Simple database connection test for Vercel deployment
"""
from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Test database connection and environment variables"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            # Check environment variables
            env_check = {
                'SUPABASE_URL_exists': bool(os.getenv('SUPABASE_URL')),
                'SUPABASE_SERVICE_ROLE_KEY_exists': bool(os.getenv('SUPABASE_SERVICE_ROLE_KEY')),
                'SUPABASE_URL_value': os.getenv('SUPABASE_URL', 'NOT_SET')[:50] + '...' if os.getenv('SUPABASE_URL') else 'NOT_SET',
                'SUPABASE_KEY_length': len(os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')) if os.getenv('SUPABASE_SERVICE_ROLE_KEY') else 0
            }
            
            # Try database connection
            db_test = None
            try:
                from supabase import create_client
                
                supabase_url = os.getenv('SUPABASE_URL')
                supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
                
                if supabase_url and supabase_key:
                    supabase = create_client(supabase_url, supabase_key)
                    
                    # Simple test query
                    result = supabase.table('user_profiles').select('count', count='exact').execute()
                    
                    db_test = {
                        'connection': 'SUCCESS',
                        'user_profiles_count': result.count,
                        'can_connect': True
                    }
                else:
                    db_test = {
                        'connection': 'FAILED',
                        'error': 'Missing environment variables',
                        'can_connect': False
                    }
                    
            except Exception as e:
                db_test = {
                    'connection': 'FAILED',
                    'error': str(e),
                    'can_connect': False
                }
            
            response_data = {
                'status': 'success',
                'environment': env_check,
                'database': db_test,
                'timestamp': '2025-08-03-17:00'
            }
            
            self.wfile.write(json.dumps(response_data, indent=2).encode())
            
        except Exception as e:
            error_data = {
                'status': 'error',
                'error': str(e),
                'timestamp': '2025-08-03-17:00'
            }
            self.wfile.write(json.dumps(error_data, indent=2).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()