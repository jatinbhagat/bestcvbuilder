"""
Simple API test to diagnose 500 errors - Using exact pattern from working API
"""

import json

def cors_headers():
    """Return CORS headers"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }

def handler(request):
    """
    Minimal handler to test what's working - matches cv-parser pattern exactly
    """
    from flask import Response
    
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        response = Response()
        for key, value in cors_headers().items():
            response.headers[key] = value
        return response
    
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
            'content_type': getattr(request, 'content_type', 'unknown'),
            'has_get_json': hasattr(request, 'get_json')
        }
        
        response_data = {
            "status": "success",
            "message": "Simple API test working - Flask Response pattern",
            "available_imports": available_imports,
            "request_info": request_info,
            "timestamp": "2025-08-03-15:25"
        }
        
        # Return using Flask Response like the main API
        response = Response(json.dumps(response_data), status=200, content_type='application/json')
        for key, value in cors_headers().items():
            response.headers[key] = value
        return response
        
    except Exception as e:
        # Return detailed error info
        error_data = {
            "status": "error",
            "error_message": str(e),
            "error_type": type(e).__name__,
            "timestamp": "2025-08-03-15:25"
        }
        
        response = Response(json.dumps(error_data), status=200, content_type='application/json')  # Return 200 so we can see the error
        for key, value in cors_headers().items():
            response.headers[key] = value
        return response