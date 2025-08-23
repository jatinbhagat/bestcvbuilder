"""
Debug 500 error - Simple test endpoint
"""

def handler(request):
    """Simple test to debug 500 errors"""
    
    try:
        # Basic imports test
        import json
        import os
        
        # CORS headers
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
        
        # Test response
        response_data = {
            "status": "success",
            "message": "Debug endpoint working",
            "method": request.method,
            "has_body": bool(hasattr(request, 'get_json')),
            "python_version": "3.x",
            "imports_working": True
        }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        # Return error details
        error_response = {
            "status": "error",
            "message": str(e),
            "type": type(e).__name__,
            "debug": "500 error diagnostics"
        }
        
        return {
            'statusCode': 200,  # Return 200 so we can see the error
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(error_response)
        }

# For Vercel
def main(request):
    return handler(request)