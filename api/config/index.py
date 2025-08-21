"""
Configuration API endpoint
Returns app configuration including payment bypass settings
"""

import json
import os
import sys
from typing import Dict, Any

# Add path for config imports
sys.path.append(os.path.dirname(__file__))

try:
    from app_config import get_payment_config, should_bypass_payment, is_free_mode_enabled, get_feature_flag
except ImportError:
    # Fallback configuration
    def get_payment_config():
        return {'bypass_payment': True, 'free_mode_enabled': True}
    def should_bypass_payment():
        return True
    def is_free_mode_enabled():
        return True
    def get_feature_flag(flag):
        return True

def cors_headers():
    """Return CORS headers for API responses"""
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

def handler(event, context):
    """
    Main handler function for configuration API
    
    Returns:
        Configuration data including payment bypass settings
    """
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': ''
        }
    
    # Only allow GET requests
    if event.get('httpMethod') != 'GET':
        return {
            'statusCode': 405,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        # Get configuration data
        config_data = {
            'payment': get_payment_config(),
            'bypass_payment': should_bypass_payment(),
            'free_mode_enabled': is_free_mode_enabled(),
            'features': {
                'free_cv_rewrite': get_feature_flag('free_cv_rewrite'),
                'payment_bypass': get_feature_flag('payment_bypass'),
                'unlimited_rewrites': get_feature_flag('unlimited_rewrites')
            }
        }
        
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(config_data)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error'})
        }

# For local testing
if __name__ == "__main__":
    test_event = {'httpMethod': 'GET'}
    result = handler(test_event, None)
    print(json.dumps(result, indent=2))