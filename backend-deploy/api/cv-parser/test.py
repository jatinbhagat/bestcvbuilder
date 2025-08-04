#!/usr/bin/env python3
"""
Simple test endpoint to verify Python API is working
"""

def handler(request):
    """Simple test handler"""
    
    # CORS headers for all origins
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle preflight
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    # Simple response
    return {
        'statusCode': 200,
        'headers': headers,
        'body': '{"status": "API is working", "message": "CORS fixed", "endpoint": "/api/cv-parser/test"}'
    }

# For Vercel
def main(request):
    return handler(request)