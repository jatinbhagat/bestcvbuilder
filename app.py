"""
Flask application for BestCVBuilder API
Converts Vercel serverless functions to Render.com web service
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json

# Add API modules to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'cv-parser'))

app = Flask(__name__)
CORS(app)

# Import the CV parser functions directly
try:
    from index import analyze_resume_content, ATSAnalysisError
    cv_parser_available = True
    print("✅ CV parser functions imported successfully")
except ImportError as e:
    print(f"❌ Could not import CV parser functions: {e}")
    cv_parser_available = False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render.com"""
    return jsonify({
        "status": "healthy",
        "service": "bestcvbuilder-api",
        "handlers": {
            "cv_parser": cv_parser_available,
            "cv_rewrite": False  # Not implemented yet
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
    
    if not cv_parser_available:
        return jsonify({"error": "CV parser not available"}), 500
    
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Extract required parameters
        file_url = data.get('file_url')
        if not file_url:
            return jsonify({"error": "file_url is required"}), 400
        
        # Optional parameters
        analysis_type = data.get('analysis_type', 'comprehensive')
        include_recommendations = data.get('include_recommendations', True)
        user_id = data.get('user_id')
        
        print(f"🔍 Processing CV analysis request:")
        print(f"   File URL: {file_url}")
        print(f"   Analysis Type: {analysis_type}")
        print(f"   User ID: {user_id}")
        print(f"   Function available: {callable(analyze_resume_content)}")
        
        # Call the main analysis function (only takes file_url)
        result = analyze_resume_content(file_url)
        
        print(f"✅ CV analysis completed successfully")
        print(f"📊 Analysis result keys: {list(result.keys())}")
        print(f"📧 Email used: {result.get('email_used', 'Not found')}")
        print(f"💾 Profile updated: {result.get('profile_updated', 'Not found')}")
        print(f"📄 Resume ID: {result.get('resume_id', 'Not found')}")
        print(f"📈 Analysis saved: {result.get('analysis_saved', 'Not found')}")
        print(f"🎯 ATS Score: {result.get('ats_score', 'Not found')}")
        
        # Return results with CORS headers
        response = jsonify(result)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        
        return response
        
    except ATSAnalysisError as e:
        print(f"❌ ATS Analysis Error: {e}")
        error_response = jsonify({"error": f"Analysis failed: {str(e)}"})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 400
        
    except Exception as e:
        print(f"❌ Unexpected error in cv_parser: {e}")
        import traceback
        traceback.print_exc()
        
        error_response = jsonify({"error": f"Internal server error: {str(e)}"})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500

@app.route('/api/cv-rewrite', methods=['POST', 'OPTIONS'])
def cv_rewrite():
    """CV Rewrite API endpoint (placeholder)"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    # Placeholder for future implementation
    error_response = jsonify({"error": "CV rewrite not implemented yet"})
    error_response.headers.add('Access-Control-Allow-Origin', '*')
    return error_response, 501

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting BestCVBuilder API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)