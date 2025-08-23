"""
Flask application for BestCVBuilder API
Converts Vercel serverless functions to Render.com web service
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add API modules to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'api'))

app = Flask(__name__)
CORS(app)

# Import the serverless function handlers
try:
    # Import cv-parser
    sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'cv-parser'))
    from index import handler as cv_parser_handler
    
    # Import cv-rewrite  
    sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'cv-rewrite'))
    import importlib.util
    spec = importlib.util.spec_from_file_location("cv_rewrite", os.path.join(os.path.dirname(__file__), 'api', 'cv-rewrite', 'index.py'))
    cv_rewrite_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cv_rewrite_module)
    cv_rewrite_handler = cv_rewrite_module.handler
    
    # Import resume-fix
    sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'resume-fix'))
    sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))  # Add utils to path
    spec = importlib.util.spec_from_file_location("resume_fix", os.path.join(os.path.dirname(__file__), 'api', 'resume-fix', 'index.py'))
    resume_fix_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(resume_fix_module)
    resume_fix_handler = resume_fix_module.handler
    
except ImportError as e:
    print(f"Warning: Could not import API handlers: {e}")
    cv_parser_handler = None
    cv_rewrite_handler = None
    resume_fix_handler = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render.com"""
    return jsonify({
        "status": "healthy",
        "service": "bestcvbuilder-api",
        "handlers": {
            "cv_parser": cv_parser_handler is not None,
            "cv_rewrite": cv_rewrite_handler is not None,
            "resume_fix": resume_fix_handler is not None
        }
    })

@app.route('/api/cv-parser', methods=['POST', 'OPTIONS'])
def cv_parser():
    """CV Parser API endpoint"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    if cv_parser_handler is None:
        return jsonify({"error": "CV parser handler not available"}), 500
    
    # Convert Flask request to Vercel-like event format
    event = {
        'body': request.get_json(),
        'headers': dict(request.headers),
        'httpMethod': request.method,
        'path': '/api/cv-parser'
    }
    
    # Mock context object
    context = type('obj', (object,), {})()
    
    try:
        result = cv_parser_handler(event, context)
        
        # Handle Vercel response format
        if isinstance(result, dict):
            if 'statusCode' in result:
                response = jsonify(result.get('body', {}))
                response.status_code = result['statusCode']
                
                # Add headers if present
                if 'headers' in result:
                    for key, value in result['headers'].items():
                        response.headers[key] = value
                        
                return response
            else:
                return jsonify(result)
        else:
            return result
            
    except Exception as e:
        print(f"Error in cv_parser: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/cv-rewrite', methods=['POST', 'OPTIONS'])
def cv_rewrite():
    """CV Rewrite API endpoint"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    if cv_rewrite_handler is None:
        return jsonify({"error": "CV rewrite handler not available"}), 500
    
    # Convert Flask request to Vercel-like event format
    event = {
        'body': request.get_json(),
        'headers': dict(request.headers),
        'httpMethod': request.method,
        'path': '/api/cv-rewrite'
    }
    
    # Mock context object
    context = type('obj', (object,), {})()
    
    try:
        result = cv_rewrite_handler(event, context)
        
        # Handle Vercel response format
        if isinstance(result, dict):
            if 'statusCode' in result:
                response = jsonify(result.get('body', {}))
                response.status_code = result['statusCode']
                
                # Add headers if present
                if 'headers' in result:
                    for key, value in result['headers'].items():
                        response.headers[key] = value
                        
                return response
            else:
                return jsonify(result)
        else:
            return result
            
    except Exception as e:
        print(f"Error in cv_rewrite: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/resume-fix', methods=['POST', 'OPTIONS'])
def resume_fix():
    """Resume Fix API endpoint"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    if resume_fix_handler is None:
        return jsonify({"error": "Resume fix handler not available"}), 500
    
    # Create a mock request object for the handler
    class MockRequest:
        def __init__(self, method, json_data):
            self.method = method
            self._json = json_data
        
        def get_json(self):
            return self._json
    
    mock_request = MockRequest(request.method, request.get_json())
    
    try:
        result = resume_fix_handler(mock_request)
        
        # Handle various response formats
        if isinstance(result, dict):
            if 'statusCode' in result:
                response = jsonify(result.get('body', {}))
                response.status_code = result['statusCode']
                
                # Add headers if present
                if 'headers' in result:
                    for key, value in result['headers'].items():
                        response.headers[key] = value
                        
                return response
            else:
                return jsonify(result)
        else:
            return result
            
    except Exception as e:
        print(f"Error in resume_fix: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)