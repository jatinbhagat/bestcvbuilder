"""
Absolute minimal test - no external imports
"""

def handler(request):
    """Absolutely minimal handler to test Vercel function invocation"""
    
    # Basic response without any imports
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': '{"status": "success", "message": "Minimal test working", "timestamp": "2025-08-03-15:30"}'
    }