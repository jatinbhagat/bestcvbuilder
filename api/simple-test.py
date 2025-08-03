"""
Simple API test to diagnose 500 errors
"""

from flask import Flask, request, jsonify
import json

app = Flask(__name__)

@app.route('/api/simple-test', methods=['GET', 'POST', 'OPTIONS'])
def handler():
    """Minimal handler to test what's working"""
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    # Handle preflight
    if request.method == 'OPTIONS':
        return '', 200, headers
    
    try:
        # Test what we can import
        available_imports = []
        
        try:
            import PyPDF2
            available_imports.append('PyPDF2 - OK')
        except Exception as e:
            available_imports.append(f'PyPDF2 - FAILED: {str(e)}')
            
        try:
            import docx
            available_imports.append('docx - OK')
        except Exception as e:
            available_imports.append(f'docx - FAILED: {str(e)}')
            
        try:
            import requests
            available_imports.append('requests - OK')
        except Exception as e:
            available_imports.append(f'requests - FAILED: {str(e)}')
        
        # Test request data
        request_info = {
            'method': request.method,
            'content_type': request.content_type or 'unknown',
            'args': dict(request.args),
            'headers_count': len(request.headers)
        }
        
        response_data = {
            "status": "success",
            "message": "Simple API test working with Flask",
            "available_imports": available_imports,
            "request_info": request_info,
            "timestamp": "2025-08-03-15:20"
        }
        
        response = jsonify(response_data)
        for key, value in headers.items():
            response.headers[key] = value
        return response
        
    except Exception as e:
        # Return detailed error info
        error_data = {
            "status": "error",
            "error_message": str(e),
            "error_type": type(e).__name__,
            "timestamp": "2025-08-03-15:20"
        }
        
        response = jsonify(error_data)
        for key, value in headers.items():
            response.headers[key] = value
        return response