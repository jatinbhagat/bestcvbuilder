"""
Grammar and Spelling Check API - Free LLM-powered analysis
Uses Gemini Flash for accurate grammar and spelling assessment
Available for all users without payment requirement
"""

import json
import os
import sys
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add utils to path for imports
sys.path.append('/var/task/utils')  # Vercel serverless path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'utils'))  # Local development

try:
    from llm_utils import SimpleGeminiOptimizer
    GEMINI_AVAILABLE = True
except ImportError as e:
    logger.error(f"Failed to import LLM utilities: {e}")
    GEMINI_AVAILABLE = False

# CORS headers
def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    }

def handler(request):
    """
    Main handler for grammar and spelling check API
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': ''
        }
    
    if request.method != 'POST':
        return {
            'statusCode': 405,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        logger.info("🔍 Grammar/Spelling check request started")
        
        # Parse request body
        try:
            if hasattr(request, 'get_json'):
                data = request.get_json()
            else:
                body = request.body if hasattr(request, 'body') else request.get('body', '')
                if isinstance(body, bytes):
                    body = body.decode('utf-8')
                data = json.loads(body)
        except Exception as e:
            logger.error(f"Failed to parse request body: {e}")
            return error_response("Invalid JSON in request body", 400)
        
        # Validate input
        if not data.get('text'):
            return error_response("Missing 'text' field", 400)
        
        if not data.get('check_type') or data.get('check_type') not in ['grammar', 'spelling']:
            return error_response("Missing or invalid 'check_type'. Must be 'grammar' or 'spelling'", 400)
        
        text = data['text']
        check_type = data['check_type']
        
        # Perform LLM analysis
        result = perform_llm_check(text, check_type)
        
        logger.info(f"✅ {check_type} check completed successfully")
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps(result)
        }
        
    except Exception as e:
        logger.error(f"❌ Grammar/Spelling check failed: {str(e)}")
        return error_response(f"Internal server error: {str(e)}", 500)

def perform_llm_check(text: str, check_type: str) -> Dict[str, Any]:
    """
    Perform LLM-powered grammar or spelling check
    """
    if not GEMINI_AVAILABLE:
        return fallback_analysis(text, check_type)
    
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        logger.warning("Gemini API key not available, using fallback analysis")
        return fallback_analysis(text, check_type)
    
    try:
        optimizer = SimpleGeminiOptimizer(api_key=gemini_api_key)
        
        if not optimizer.available:
            logger.warning("Gemini optimizer not available, using fallback analysis")
            return fallback_analysis(text, check_type)
        
        # Create prompt based on check type
        if check_type == 'grammar':
            prompt = create_grammar_check_prompt(text)
        else:  # spelling
            prompt = create_spelling_check_prompt(text)
        
        # Make Gemini request
        response_text, cost_info = optimizer._make_gemini_request(prompt, max_tokens=500)
        
        # Parse response
        result = parse_llm_response(response_text, check_type)
        
        logger.info(f"💰 Gemini cost: ${cost_info.estimated_cost_usd:.4f}")
        return result
        
    except Exception as e:
        logger.error(f"LLM check failed: {e}")
        return fallback_analysis(text, check_type)

def create_grammar_check_prompt(text: str) -> str:
    """Create prompt for grammar analysis"""
    return f"""Analyze the grammar quality of this resume text and provide a score from 0-10.

Consider:
- Subject-verb agreement
- Verb tense consistency
- Sentence structure
- Proper punctuation
- Professional language usage

Text to analyze:
{text}

Response format (JSON):
{{
    "grammar_score": [0-10 integer],
    "issues_found": [number of issues],
    "major_issues": ["list of major grammar problems"],
    "suggestions": ["brief improvement suggestions"]
}}

Provide only the JSON response."""

def create_spelling_check_prompt(text: str) -> str:
    """Create prompt for spelling analysis"""
    return f"""Analyze the spelling and consistency quality of this resume text and provide a score from 0-10.

Consider:
- Spelling errors
- Consistent formatting
- Date format consistency
- Professional terminology usage
- Typos and common mistakes

Text to analyze:
{text}

Response format (JSON):
{{
    "spelling_score": [0-10 integer],
    "errors_found": [number of errors],
    "misspelled_words": ["list of misspelled words"],
    "consistency_issues": ["formatting inconsistencies"]
}}

Provide only the JSON response."""

def parse_llm_response(response_text: str, check_type: str) -> Dict[str, Any]:
    """Parse LLM response and extract scores"""
    try:
        # Try to extract JSON from response
        import re
        json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
        if json_match:
            response_data = json.loads(json_match.group())
            
            if check_type == 'grammar':
                return {
                    'grammar_score': max(0, min(10, response_data.get('grammar_score', 8))),
                    'issues_found': response_data.get('issues_found', 0),
                    'details': response_data.get('major_issues', []),
                    'suggestions': response_data.get('suggestions', [])
                }
            else:  # spelling
                return {
                    'spelling_score': max(0, min(10, response_data.get('spelling_score', 8))),
                    'errors_found': response_data.get('errors_found', 0),
                    'details': response_data.get('misspelled_words', []),
                    'consistency_issues': response_data.get('consistency_issues', [])
                }
    except:
        pass
    
    # Fallback if JSON parsing fails
    score = 8 if len(response_text) > 50 else 6
    if check_type == 'grammar':
        return {'grammar_score': score, 'issues_found': 0, 'details': [], 'suggestions': []}
    else:
        return {'spelling_score': score, 'errors_found': 0, 'details': [], 'consistency_issues': []}

def fallback_analysis(text: str, check_type: str) -> Dict[str, Any]:
    """Fallback analysis when LLM is not available"""
    if check_type == 'grammar':
        # Basic grammar scoring based on text quality
        score = 6
        if len(text) > 200:
            score += 1
        if '.' in text and len(text.split('.')) > 3:
            score += 1
        if any(word in text.lower() for word in ['led', 'managed', 'developed', 'created']):
            score += 1
        
        return {
            'grammar_score': min(score, 10),
            'issues_found': 0,
            'details': ['Fallback analysis - consider upgrading for detailed grammar check'],
            'suggestions': ['Use strong action verbs', 'Ensure consistent tense usage']
        }
    else:  # spelling
        score = 6
        if len(text) > 200:
            score += 1
        # Basic spelling error detection
        common_errors = ['recieved', 'seperate', 'managment', 'acheivement']
        errors_found = sum(1 for error in common_errors if error in text.lower())
        score -= errors_found
        
        return {
            'spelling_score': max(min(score, 10), 0),
            'errors_found': errors_found,
            'details': ['Fallback analysis - consider upgrading for detailed spell check'],
            'consistency_issues': []
        }

def error_response(message: str, status_code: int) -> Dict[str, Any]:
    """Create standardized error response"""
    return {
        'statusCode': status_code,
        'headers': get_cors_headers(),
        'body': json.dumps({
            'error': message,
            'timestamp': int(__import__('time').time())
        })
    }

# Entry point for Vercel
def main(request):
    """Vercel entry point"""
    return handler(request)

# For local testing
if __name__ == "__main__":
    class MockRequest:
        def __init__(self, method='POST', body=None):
            self.method = method
            self.body = body or json.dumps({
                'text': 'Sample resume content with some managment experiance',
                'check_type': 'spelling'
            })
    
    test_request = MockRequest()
    result = handler(test_request)
    print(f"Test result: {result}")