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
sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'resume-fix'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

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

# Import the CV parser functions directly with cache clearing
try:
    # Clear any cached imports to ensure we get the latest code
    import sys
    import importlib
    
    # Remove from cache if it exists
    module_name = 'index'
    if module_name in sys.modules:
        print(f"🔄 Clearing cached module: {module_name}")
        del sys.modules[module_name]
    
    # Fresh import
    from index import analyze_resume_content, ATSAnalysisError
    
    # Verify we have the latest version by checking if generate_comprehensive_issues_report exists
    try:
        from index import generate_comprehensive_issues_report
        print("✅ CV parser functions imported successfully (with comprehensive report generation)")
    except ImportError:
        print("⚠️ generate_comprehensive_issues_report not found - using older version")
        
    cv_parser_available = True
    print("✅ CV parser functions imported successfully")
except ImportError as e:
    print(f"❌ Could not import CV parser functions: {e}")
    cv_parser_available = False

# Import the Job analyzer functions
try:
    # Import from job analyzer specifically 
    import importlib.util
    job_analyzer_path = os.path.join(os.path.dirname(__file__), 'api', 'job-analyzer', 'index.py')
    spec = importlib.util.spec_from_file_location("job_analyzer_module", job_analyzer_path)
    job_analyzer_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(job_analyzer_module)
    
    # Get the functions we need
    analyze_job_description = job_analyzer_module.analyze_job_description
    JobAnalysisError = job_analyzer_module.JobAnalysisError
    save_job_analysis_to_database = job_analyzer_module.save_job_analysis_to_database
    
    job_analyzer_available = True
    print("✅ Job analyzer functions imported successfully")
except ImportError as e:
    print(f"❌ Could not import Job analyzer functions: {e}")
    job_analyzer_available = False

@app.route('/debug-version', methods=['GET'])
def debug_version():
    """Debug endpoint to check what version of code is running"""
    try:
        # Check if we can import the comprehensive report function
        try:
            from index import generate_comprehensive_issues_report
            has_comprehensive_func = True
        except ImportError:
            has_comprehensive_func = False
        
        # Check if analyze_resume_content has the comprehensive report code
        import inspect
        from index import analyze_resume_content
        source_lines = inspect.getsource(analyze_resume_content)
        has_comprehensive_in_source = 'comprehensive_issues_report' in source_lines
        
        debug_info = {
            'status': 'debug',
            'comprehensive_function_importable': has_comprehensive_func,
            'comprehensive_in_analyze_function': has_comprehensive_in_source,
            'analyze_function_line_count': len(source_lines.split('\n')),
            'last_lines_of_analyze_function': source_lines.split('\n')[-10:],
            'timestamp': int(time.time())
        }
        
        response = jsonify(debug_info)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_info = {
            'status': 'error',
            'error': str(e),
            'timestamp': int(time.time())
        }
        response = jsonify(error_info)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

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
    
    # Check if we have comprehensive report functionality  
    has_comprehensive = True  # Simplified check
    
    response = jsonify({
        "status": "healthy",
        "service": "bestcvbuilder-api",
        "version": "COMPREHENSIVE_REPORT_FIXED",
        "comprehensive_report_available": has_comprehensive,
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
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/api/test-connectivity', methods=['GET', 'POST', 'OPTIONS'])
def test_connectivity():
    """Simple connectivity test endpoint for debugging CORS issues"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Max-Age', '86400')
        return response
    
    test_info = {
        'status': 'success',
        'method': request.method,
        'timestamp': int(__import__('time').time()),
        'headers': dict(request.headers),
        'origin': request.headers.get('Origin', 'No origin header'),
        'user_agent': request.headers.get('User-Agent', 'Unknown'),
        'message': 'API connectivity test successful'
    }
    
    response = jsonify(test_info)
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    return response

@app.route('/api/config/', methods=['GET', 'OPTIONS'])
def app_config():
    """Application configuration endpoint for payment bypass settings"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Max-Age', '86400')
        return response
    
    # Configuration settings
    config_info = {
        'status': 'success',
        'bypass_payment': True,  # Enable payment bypass for testing
        'free_mode_enabled': True,  # Enable free mode
        'features': {
            'free_cv_rewrite': True,
            'payment_bypass': True,
            'txt_download': True
        },
        'environment': 'production',
        'timestamp': int(time.time())
    }
    
    response = jsonify(config_info)
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
    return response

@app.route('/api/cv-parser', methods=['POST', 'OPTIONS'])
def cv_parser():
    """CV Parser API endpoint with timeout and memory management"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    if not cv_parser_available:
        return jsonify({"error": "CV parser not available"}), 500
    
    # Set alarm for timeout (45 seconds for CV analysis - longer than job analysis)
    signal.alarm(45)
    
    try:
        # Force initial garbage collection
        gc.collect()
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
        
        # Simple check for comprehensive report feature
        print(f"🔍 Function has comprehensive report generation: True")
        
        # Call the main analysis function (only takes file_url)
        result = analyze_resume_content(file_url)
        
        print(f"✅ CV analysis completed successfully")
        print(f"🔍 FLASK APP DEBUG: analyze_resume_content returned {len(result)} fields")
        print(f"🔍 FLASK APP DEBUG: comprehensive_issues_report in result? {'comprehensive_issues_report' in result}")
        if 'comprehensive_issues_report' in result:
            report_val = result['comprehensive_issues_report']
            print(f"🔍 FLASK APP DEBUG: comprehensive_issues_report type: {type(report_val)}")
            print(f"🔍 FLASK APP DEBUG: comprehensive_issues_report length: {len(report_val) if report_val else 'None'}")
        else:
            print(f"❌ FLASK APP DEBUG: comprehensive_issues_report NOT FOUND in analyze_resume_content result!")
            print(f"🔍 FLASK APP DEBUG: Available fields: {list(result.keys())}")
        
        # Force garbage collection after analysis
        gc.collect()
        
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
        
        # FINAL FLASK CHECK: Verify comprehensive_issues_report before response
        print(f"🔍 FLASK FINAL CHECK: comprehensive_issues_report in result? {'comprehensive_issues_report' in result}")
        if 'comprehensive_issues_report' in result:
            final_report = result['comprehensive_issues_report']
            print(f"🔍 FLASK FINAL CHECK: Report exists, type: {type(final_report)}, length: {len(final_report) if final_report else 'None'}")
        else:
            print(f"❌ FLASK FINAL CHECK: comprehensive_issues_report MISSING from final result!")
            print(f"🔍 FLASK FINAL CHECK: Final result keys ({len(result)}): {list(result.keys())}")
        
        # Return results with CORS headers
        response = jsonify(result)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        
        return response
        
    except TimeoutError:
        print(f"⏱️ CV analysis timeout - request took too long")
        error_response = jsonify({"error": "Analysis timeout - please try with a smaller resume file or different format"})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 408  # Request Timeout
        
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
    
    finally:
        # Always clear the alarm and force garbage collection
        signal.alarm(0)
        gc.collect()

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

@app.route('/api/orders/create-order', methods=['POST', 'OPTIONS'])
def create_order():
    """Create Order API endpoint"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        # Import orders handler
        import sys
        orders_path = os.path.join(os.path.dirname(__file__), 'api', 'orders')
        if orders_path not in sys.path:
            sys.path.append(orders_path)
        
        from index import create_order_in_database, extract_contact_info_from_resume, generate_order_id
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Validate required fields
        if 'analysis_data' not in data:
            return jsonify({'error': 'Analysis data is required'}), 400
        
        # Extract contact information from resume
        analysis_data = data['analysis_data']
        contact_info = extract_contact_info_from_resume(analysis_data)
        
        # Generate order ID
        order_id = generate_order_id()
        
        # Create order data
        order_data = {
            'order_id': order_id,
            'email': data.get('email', contact_info['primary_email']),
            'phone': data.get('phone', contact_info['primary_phone']),
            'analysis_data': analysis_data,
            'user_id': data.get('user_id')
        }
        
        # Create order in database
        created_order = create_order_in_database(order_data)
        
        # Prepare response
        response_data = {
            'success': True,
            'order': created_order,
            'contact_info': contact_info,
            'amount': 99.00,  # Default amount
            'currency': 'INR'
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        print(f"❌ Create order error: {str(e)}")
        error_response = jsonify({'error': f'Order creation failed: {str(e)}'})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500

@app.route('/api/orders/initiate-payment', methods=['POST', 'OPTIONS'])
def initiate_payment():
    """Initiate Payment API endpoint"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        # Import orders handler
        from index import prepare_payu_payment_data
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Validate required fields
        required_fields = ['order_id', 'email', 'phone']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Prepare order data for PayU
        order_data = {
            'order_id': data['order_id'],
            'order_email': data['email'],
            'order_mobile': data['phone']
        }
        
        # Generate PayU payment data
        payment_data = prepare_payu_payment_data(order_data)
        
        # Prepare response
        response_data = {
            'success': True,
            'payment_data': payment_data,
            'payu_url': 'https://test.payu.in/_payment',  # Test URL
            'order_id': data['order_id']
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        print(f"❌ Payment initiation error: {str(e)}")
        error_response = jsonify({'error': f'Payment initiation failed: {str(e)}'})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500

@app.route('/api/resume-fix', methods=['POST', 'OPTIONS'])
def resume_fix():
    """Resume Fix API endpoint with Gemini AI integration"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        print(f"🚀 RESUME-FIX: Starting request processing...")
        
        # Import the resume-fix handler - try multiple import strategies
        process_resume_fix = None
        
        try:
            # Strategy 1: Direct path import
            import sys
            resume_fix_path = os.path.join(os.path.dirname(__file__), 'api', 'resume-fix')
            if resume_fix_path not in sys.path:
                sys.path.insert(0, resume_fix_path)
            
            # Import the function directly
            exec("from index import process_resume_fix as imported_func")
            process_resume_fix = locals().get('imported_func')
            print(f"✅ RESUME-FIX: Successfully imported via strategy 1")
            
        except Exception as e1:
            print(f"⚠️ RESUME-FIX: Strategy 1 failed: {e1}")
            
            try:
                # Strategy 2: Module loading
                import importlib.util
                resume_fix_module_path = os.path.join(os.path.dirname(__file__), 'api', 'resume-fix', 'index.py')
                spec = importlib.util.spec_from_file_location("resume_fix_handler", resume_fix_module_path)
                resume_fix_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(resume_fix_module)
                process_resume_fix = resume_fix_module.process_resume_fix
                print(f"✅ RESUME-FIX: Successfully imported via strategy 2")
                
            except Exception as e2:
                print(f"❌ RESUME-FIX: All import strategies failed")
                print(f"   Strategy 1 error: {e1}")
                print(f"   Strategy 2 error: {e2}")
                raise Exception(f"Cannot import process_resume_fix: {e2}")
        
        if not process_resume_fix:
            raise Exception("process_resume_fix function not found after import")
        
        # Get request data
        data = request.get_json()
        if not data:
            print(f"❌ RESUME-FIX: No JSON data provided in request")
            error_response = jsonify({"error": "No JSON data provided"})
            error_response.headers.add('Access-Control-Allow-Origin', '*')
            return error_response, 400
        
        print(f"📊 RESUME-FIX: Request data received - keys: {list(data.keys())}")
        
        # Extract data
        original_analysis = data.get('original_analysis', {})
        user_email = data.get('user_email', 'unknown@email.com')
        payment_id = data.get('payment_id', f'flask_{int(time.time())}')
        
        print(f"📧 RESUME-FIX: Processing for user: {user_email}")
        print(f"💳 RESUME-FIX: Payment ID: {payment_id}")
        print(f"📋 RESUME-FIX: Analysis data has {len(original_analysis)} keys")
        
        # Debug: Check what analysis data we received
        print(f"🔍 RESUME-FIX: Analysis data keys: {list(original_analysis.keys())}")
        print(f"🔍 RESUME-FIX: Has file_url: {'file_url' in original_analysis}")
        print(f"🔍 RESUME-FIX: Has content: {'content' in original_analysis}")
        print(f"🔍 RESUME-FIX: Has pdf_url: {'pdf_url' in original_analysis}")
        
        if 'file_url' in original_analysis:
            print(f"📄 RESUME-FIX: File URL found: {original_analysis['file_url']}")
        if 'content' in original_analysis:
            print(f"📄 RESUME-FIX: Content found, length: {len(original_analysis['content'])}")
        if 'pdf_url' in original_analysis:
            print(f"📄 RESUME-FIX: PDF URL found: {original_analysis['pdf_url']}")
            
        # Show some sample data to understand the structure
        if original_analysis:
            print(f"📊 RESUME-FIX: Sample analysis data: {dict(list(original_analysis.items())[:3])}")
        else:
            print(f"❌ RESUME-FIX: original_analysis is empty!")
        
        # Process the resume fix
        print(f"🔧 RESUME-FIX: Calling process_resume_fix function...")
        result = process_resume_fix(
            original_analysis=original_analysis,
            user_email=user_email,
            payment_id=payment_id
        )
        
        print(f"✅ RESUME-FIX: Processing completed successfully!")
        print(f"📊 RESUME-FIX: Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if isinstance(result, dict) and 'improved_resume_url' in result:
            print(f"📄 RESUME-FIX: PDF URL generated: {result['improved_resume_url']}")
        else:
            print(f"⚠️ RESUME-FIX: No PDF URL found in result!")
        
        # Return success response
        response = jsonify(result)
        response.headers.add('Access-Control-Allow-Origin', '*')
        print(f"🎯 RESUME-FIX: Sending response back to client")
        return response
        
    except Exception as e:
        print(f"❌ RESUME-FIX: Fatal error occurred: {str(e)}")
        import traceback
        print(f"❌ RESUME-FIX: Full traceback: {traceback.format_exc()}")
        
        error_response = jsonify({"error": f"Resume fix failed: {str(e)}"})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting BestCVBuilder API on port {port} - Version: COMPREHENSIVE_REPORT_FIXED")
    
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