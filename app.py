"""
Flask application for BestCVBuilder API
Converts Vercel serverless functions to Render.com web service
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.serving import WSGIRequestHandler
import sys
import os
import json
import time
import gc
import signal

# Add API modules to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'cv-parser'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'job-analyzer'))

app = Flask(__name__)
CORS(app)

# Configure timeout and memory management
app.config.update(
    # Request timeout settings
    PERMANENT_SESSION_LIFETIME=300,  # 5 minutes
    SEND_FILE_MAX_AGE_DEFAULT=0,
)

# Set request timeout for development
WSGIRequestHandler.timeout = 60  # 60 seconds timeout

# Timeout handler for production
def timeout_handler(signum, frame):
    raise TimeoutError("Request timeout - operation took too long")

signal.signal(signal.SIGALRM, timeout_handler)

# Import the CV parser functions directly
try:
    from index import analyze_resume_content, ATSAnalysisError
    cv_parser_available = True
    print("✅ CV parser functions imported successfully")
except ImportError as e:
    print(f"❌ Could not import CV parser functions: {e}")
    cv_parser_available = False

# Import the Job analyzer functions
try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api', 'job-analyzer'))
    from job_analyzer import analyze_job_description, JobAnalysisError, save_job_analysis_to_database
    job_analyzer_available = True
    print("✅ Job analyzer functions imported successfully")
except ImportError as e:
    print(f"❌ Could not import Job analyzer functions: {e}")
    job_analyzer_available = False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render.com"""
    # Test Supabase connection
    supabase_status = "unknown"
    try:
        import os
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
        
        if supabase_url and supabase_key:
            from supabase import create_client
            supabase = create_client(supabase_url, supabase_key)
            # Simple test query
            result = supabase.table('user_profiles').select("count").limit(1).execute()
            supabase_status = "connected"
        else:
            supabase_status = "missing_env_vars"
    except Exception as e:
        supabase_status = f"error: {str(e)}"
    
    return jsonify({
        "status": "healthy",
        "service": "bestcvbuilder-api",
        "handlers": {
            "cv_parser": cv_parser_available,
            "cv_rewrite": False,
            "job_analyzer": job_analyzer_available
        },
        "supabase": supabase_status,
        "env_vars": {
            "supabase_url": bool(os.environ.get('SUPABASE_URL')),
            "supabase_key": bool(os.environ.get('PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'))
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
        
        # Add database operations (from Vercel handler)
        try:
            from index import (save_user_profile_data, save_resume_record, save_analysis_results, 
                              handle_missing_email, generate_session_uuid, get_file_info_from_url)
            
            # Extract personal information and handle email with UUID fallback
            personal_info = result.get('personal_information', {})
            session_uuid = generate_session_uuid()
            
            # Handle missing email with UUID fallback
            final_email = handle_missing_email(personal_info, session_uuid)
            is_temp_email = '@bestcvbuilder.com' in final_email
            
            print(f"🔍 Processing CV with email: {final_email} (temporary: {is_temp_email})")
            
            # Step 1: Save/update user profile with UUID tracking
            print(f"🔄 Attempting to save user profile for: {final_email}")
            try:
                profile_saved = save_user_profile_data(final_email, personal_info, session_uuid)
                print(f"✅ Profile save result: {profile_saved}")
            except Exception as e:
                print(f"❌ Profile save failed: {str(e)}")
                profile_saved = False
                
            result['profile_updated'] = profile_saved
            result['session_uuid'] = session_uuid
            result['email_used'] = final_email
            result['is_temporary_email'] = is_temp_email
            
            # Step 2: Save resume record with UUID
            print(f"🔄 Attempting to save resume record...")
            try:
                file_info = get_file_info_from_url(file_url)
                if not file_info:
                    file_info = {
                        'original_filename': 'uploaded_resume.pdf',
                        'file_size': 1024,  # Default size
                        'file_type': 'pdf'
                    }
                print(f"📄 File info: {file_info}")
                resume_id = save_resume_record(final_email, file_url, file_info, session_uuid)
                print(f"✅ Resume save result - ID: {resume_id}")
            except Exception as e:
                print(f"❌ Resume save failed: {str(e)}")
                resume_id = None
                
            result['resume_id'] = resume_id
            
            # Step 3: Save analysis results with UUID
            if resume_id:
                print(f"🔄 Attempting to save analysis results for resume {resume_id}...")
                try:
                    analysis_saved = save_analysis_results(final_email, resume_id, result, session_uuid)
                    print(f"✅ Analysis save result: {analysis_saved}")
                except Exception as e:
                    print(f"❌ Analysis save failed: {str(e)}")
                    analysis_saved = False
            else:
                print(f"⚠️  Skipping analysis save - no resume ID")
                analysis_saved = False
                
            result['analysis_saved'] = analysis_saved
                
            print(f"📧 Email used: {final_email}")
            print(f"💾 Profile updated: {profile_saved}")
            print(f"📄 Resume ID: {resume_id}")
            print(f"📈 Analysis saved: {result.get('analysis_saved', False)}")
            
        except Exception as db_error:
            print(f"❌ Database operations failed: {str(db_error)}")
            result['profile_updated'] = False
            result['database_error'] = str(db_error)
        
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

@app.route('/api/job-analyzer', methods=['POST', 'OPTIONS'])
def job_analyzer():
    """Job Analyzer API endpoint with timeout and memory management"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    if not job_analyzer_available:
        return jsonify({"error": "Job analyzer not available"}), 500
    
    # Set alarm for timeout (30 seconds for job analysis)
    signal.alarm(30)
    
    try:
        # Force initial garbage collection
        gc.collect()
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Extract required parameters
        job_description = data.get('job_description')
        if not job_description or len(job_description.strip()) < 50:
            return jsonify({"error": "Job description is required and must be at least 50 characters"}), 400
        
        # Optional parameters
        role_title = data.get('role_title', '')
        company_name = data.get('company_name', '')
        user_expectations = data.get('user_expectations', {})
        
        print(f"🔍 Processing job analysis request:")
        print(f"   Role Title: {role_title}")
        print(f"   Company: {company_name}")
        print(f"   Description Length: {len(job_description)} chars")
        print(f"   User Expectations: {bool(user_expectations)}")
        
        # Prepare job data
        job_data = {
            'job_description': job_description,
            'role_title': role_title,
            'company_name': company_name,
            'user_expectations': user_expectations
        }
        
        # Call the job analysis function
        result = analyze_job_description(job_data)
        
        print(f"✅ Job analysis completed successfully")
        print(f"🎯 Analysis Score: {result.get('analysis_score', 'Not found')}")
        
        # Force garbage collection after analysis
        gc.collect()
        
        # Save to database (similar to cv-parser pattern)
        try:
            # For now, use a dummy email pattern similar to cv-parser
            session_uuid = f"job_analysis_{int(time.time() * 1000)}"
            dummy_email = f"job_user_{session_uuid}@bestcvbuilder.com"
            
            job_analysis_id = save_job_analysis_to_database(dummy_email, result, session_uuid)
            result['job_analysis_id'] = job_analysis_id
            result['session_uuid'] = session_uuid
            
            print(f"📊 Job analysis saved with ID: {job_analysis_id}")
            
        except Exception as db_error:
            print(f"❌ Database save failed: {str(db_error)}")
            result['database_error'] = str(db_error)
        
        # Return results with CORS headers
        response = jsonify(result)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        
        return response
        
    except TimeoutError:
        print(f"⏱️ Job analysis timeout - request took too long")
        error_response = jsonify({"error": "Analysis timeout - please try with a shorter job description"})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 408  # Request Timeout
        
    except JobAnalysisError as e:
        print(f"❌ Job Analysis Error: {e}")
        error_response = jsonify({"error": f"Analysis failed: {str(e)}"})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 400
        
    except Exception as e:
        print(f"❌ Unexpected error in job_analyzer: {e}")
        import traceback
        traceback.print_exc()
        
        error_response = jsonify({"error": f"Internal server error: {str(e)}"})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500
    
    finally:
        # Always clear the alarm and force garbage collection
        signal.alarm(0)
        gc.collect()

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
    
    # Configure for memory efficiency
    if os.environ.get('RENDER'):
        # Production settings for Render
        app.run(
            host='0.0.0.0', 
            port=port, 
            debug=False,
            threaded=True,
            processes=1,  # Single process to limit memory usage
            use_reloader=False
        )
    else:
        # Development settings
        app.run(host='0.0.0.0', port=port, debug=False)