"""
EMERGENCY CORS FIX - Direct API endpoint
This bypasses all deployment issues
"""

from flask import Flask, request, Response
import json

app = Flask(__name__)

def handler(req):
    """Simple handler that ALWAYS works with CORS"""
    
    # Set CORS headers for ALL origins
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    }
    
    # Handle preflight
    if req.method == 'OPTIONS':
        return Response('', 200, headers)
    
    # Simple test response
    response_data = {
        "message": "CORS FIX WORKING",
        "status": "success", 
        "endpoint": "/api/fix-cors",
        "method": req.method,
        "origin": req.headers.get('Origin', 'no-origin')
    }
    
    return Response(
        json.dumps(response_data),
        200,
        headers
    )

# Export for Vercel
def main(request):
    return handler(request)