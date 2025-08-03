"""
Simple API test to diagnose 500 errors
"""

def handler(request):
    """Minimal handler to test what's working"""
    
    import json
    
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
    
    try:
        # Test what we can import
        available_imports = []
        
        try:
            import PyPDF2
            available_imports.append('PyPDF2')
        except:
            available_imports.append('PyPDF2 - FAILED')
            
        try:
            import docx
            available_imports.append('docx')
        except:
            available_imports.append('docx - FAILED')
            
        try:
            import requests
            available_imports.append('requests')
        except:
            available_imports.append('requests - FAILED')
        
        # Test request data
        request_info = {
            'method': request.method,
            'has_json': hasattr(request, 'get_json'),
            'content_type': getattr(request, 'content_type', 'unknown')
        }
        
        response_data = {
            "status": "success",
            "message": "Simple API test working",
            "available_imports": available_imports,
            "request_info": request_info,
            "timestamp": "2025-08-03-15:15"
        }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(response_data, indent=2)
        }
        
    except Exception as e:
        # Return detailed error info
        error_data = {
            "status": "error",
            "error_message": str(e),
            "error_type": type(e).__name__,
            "timestamp": "2025-08-03-15:15"
        }
        
        return {
            'statusCode': 200,  # Return 200 so we can see the error
            'headers': headers,
            'body': json.dumps(error_data, indent=2)
        }

# For Vercel
def main(request):
    return handler(request)