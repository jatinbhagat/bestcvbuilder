"""
Simple CV parser test to isolate the issue
"""
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return
    
    def do_POST(self):
        """Handle POST requests for CV analysis"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                body_data = self.rfile.read(content_length).decode('utf-8')
                body = json.loads(body_data)
            else:
                body = {}
            
            file_url = body.get('file_url')
            
            if not file_url:
                self.send_error_response({'error': 'file_url is required'}, 400)
                return
            
            # Test basic imports that main API uses
            import_status = {}
            
            try:
                import requests
                import_status['requests'] = 'OK'
            except Exception as e:
                import_status['requests'] = f'FAILED: {str(e)}'
            
            try:
                import PyPDF2
                import_status['PyPDF2'] = 'OK'
            except Exception as e:
                import_status['PyPDF2'] = f'FAILED: {str(e)}'
            
            try:
                import docx
                import_status['docx'] = 'OK'
            except Exception as e:
                import_status['docx'] = f'FAILED: {str(e)}'
            
            # Return test results
            result = {
                "status": "success",
                "message": "Simple CV parser test working",
                "file_url_received": file_url,
                "import_status": import_status,
                "timestamp": "2025-08-03-15:40"
            }
            
            self.send_success_response(result)
            
        except Exception as e:
            self.send_error_response({'error': f'Unexpected error: {str(e)}'}, 500)
    
    def do_GET(self):
        """Handle GET requests - not allowed for this API"""
        self.send_error_response({'error': 'Method not allowed - use POST'}, 405)
    
    def send_success_response(self, data):
        """Send successful JSON response"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def send_error_response(self, error_data, status_code):
        """Send error JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(error_data).encode('utf-8'))