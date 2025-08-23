"""
Simple database insert test
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import uuid

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Test inserting a simple record"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            from supabase import create_client
            
            supabase_url = os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
            
            if not supabase_url or not supabase_key:
                self.wfile.write(json.dumps({
                    'status': 'error',
                    'error': 'Environment variables not set'
                }).encode())
                return
            
            supabase = create_client(supabase_url, supabase_key)
            
            # Create test data
            test_email = f"test-{str(uuid.uuid4())[:8]}@bestcvbuilder.com"
            test_uuid = str(uuid.uuid4())
            
            # Try to insert test user profile
            profile_data = {
                'email': test_email,
                'session_uuid': test_uuid,
                'email_source': 'generated_temp',
                'full_name': 'Test User',
                'phone': '+1234567890'
            }
            
            result = supabase.table('user_profiles').insert(profile_data).execute()
            
            response_data = {
                'status': 'success',
                'message': 'Test record inserted successfully',
                'test_email': test_email,
                'test_uuid': test_uuid,
                'insert_result': bool(result.data),
                'record_count': len(result.data) if result.data else 0
            }
            
            self.wfile.write(json.dumps(response_data, indent=2).encode())
            
        except Exception as e:
            error_data = {
                'status': 'error',
                'error': str(e),
                'error_type': type(e).__name__
            }
            self.wfile.write(json.dumps(error_data, indent=2).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()