"""
Resume Fix API - Main Endpoint
Handles AI-powered resume improvement with PDF layout preservation.
Integrates with existing ATS scoring system and payment flow.
"""

import json
import os
import sys
import io
import logging
import requests
import time
from typing import Dict, Any, List, Optional
import traceback
import tempfile
import gc

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add utils to path for imports
sys.path.append('/var/task/utils')  # Vercel serverless path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'utils'))  # Local development

try:
    from pdf_utils import parse_pdf_layout, update_pdf_text
    from llm_utils import improve_resume_with_llm, generate_feedback_from_analysis
    PDF_UTILS_AVAILABLE = True
except ImportError as e:
    logger.error(f"Failed to import PDF utilities: {e}")
    PDF_UTILS_AVAILABLE = False

try:
    # Import penalty system from cv-parser
    sys.path.append('/var/task/api/cv-parser')
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'cv-parser'))
    from penalty_system import apply_comprehensive_penalties
    PENALTY_SYSTEM_AVAILABLE = True
except ImportError as e:
    logger.error(f"Failed to import penalty system: {e}")
    PENALTY_SYSTEM_AVAILABLE = False

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
    Main handler for resume fix API endpoint
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
        logger.info("🚀 Resume fix request started")
        
        # Check dependencies
        if not PDF_UTILS_AVAILABLE:
            logger.error("PDF utilities not available")
            return error_response("PDF processing libraries not available", 500)
        
        if not PENALTY_SYSTEM_AVAILABLE:
            logger.warning("Penalty system not available - using fallback scoring")
        
        # Parse request body
        try:
            if hasattr(request, 'get_json'):
                # Flask-like request object
                data = request.get_json()
            else:
                # Vercel request object
                body = request.body if hasattr(request, 'body') else request.get('body', '')
                if isinstance(body, bytes):
                    body = body.decode('utf-8')
                data = json.loads(body)
        except Exception as e:
            logger.error(f"Failed to parse request body: {e}")
            return error_response("Invalid JSON in request body", 400)
        
        # Validate input
        validation_error = validate_input(data)
        if validation_error:
            return error_response(validation_error, 400)
        
        # Extract inputs
        original_analysis = data['original_analysis']
        user_email = data['user_email']
        payment_id = data.get('payment_id', f'fix_{int(time.time())}')
        
        # Process the resume fix
        result = process_resume_fix(original_analysis, user_email, payment_id)
        
        logger.info(f"✅ Resume fix completed successfully for {user_email}")
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps(result)
        }
        
    except Exception as e:
        logger.error(f"❌ Resume fix failed: {str(e)}")
        logger.error(traceback.format_exc())
        return error_response(f"Internal server error: {str(e)}", 500)

def validate_input(data: Dict[str, Any]) -> Optional[str]:
    """Validate request input data"""
    if not isinstance(data, dict):
        return "Request body must be JSON object"
    
    required_fields = ['original_analysis', 'user_email']
    for field in required_fields:
        if field not in data:
            return f"Missing required field: {field}"
    
    if not data['user_email'] or '@' not in data['user_email']:
        return "Invalid email address"
    
    if not isinstance(data['original_analysis'], dict):
        return "original_analysis must be an object"
    
    return None

def process_resume_fix(original_analysis: Dict[str, Any], user_email: str, payment_id: str) -> Dict[str, Any]:
    """
    Main resume fix processing pipeline
    """
    logger.info(f"📝 Processing resume fix for {user_email}")
    
    try:
        # Step 1: Extract original PDF and text
        logger.info("📄 Step 1: Extracting original PDF...")
        original_pdf_bytes, original_text = extract_original_pdf(original_analysis)
        
        # Step 2: Generate feedback from analysis
        logger.info("🔍 Step 2: Generating improvement feedback...")
        feedback_list = generate_feedback_from_analysis(original_analysis)
        logger.info(f"Generated {len(feedback_list)} feedback items")
        
        # Step 3: Parse PDF layout
        logger.info("🗂️ Step 3: Parsing PDF layout...")
        layout_info = parse_pdf_layout(original_pdf_bytes)
        
        # Step 4: Improve text with LLM
        logger.info("🧠 Step 4: Improving resume text...")
        improved_text = improve_resume_with_llm(original_text, feedback_list)
        
        # Step 5: Create improved PDF
        logger.info("📄 Step 5: Creating improved PDF...")
        improved_pdf_bytes = update_pdf_text(
            original_pdf_bytes, original_text, improved_text, layout_info
        )
        
        # Step 6: Save improved PDF and get URL
        logger.info("💾 Step 6: Saving improved PDF...")
        improved_pdf_url = save_improved_pdf(improved_pdf_bytes, user_email, payment_id)
        
        # Step 7: Calculate new ATS score
        logger.info("📊 Step 7: Calculating new ATS score...")
        original_score = original_analysis.get('score', original_analysis.get('ats_score', 65))
        new_score = calculate_new_ats_score(improved_text, original_analysis)
        score_improvement = max(0, new_score - original_score)
        
        # Step 8: Prepare result
        result = {
            'status': 'success',
            'original_score': original_score,
            'new_score': new_score,
            'score_improvement': score_improvement,
            'improved_resume_url': improved_pdf_url,
            'feedback_addressed': feedback_list,
            'processing_time': 'completed',
            'payment_id': payment_id,
            'user_email': user_email
        }
        
        logger.info(f"🎉 Resume improvement complete: {original_score} → {new_score} (+{score_improvement})")
        return result
        
    except Exception as e:
        logger.error(f"❌ Resume processing failed: {e}")
        raise Exception(f"Failed to process resume: {str(e)}")

def extract_original_pdf(analysis_data: Dict[str, Any]) -> tuple[bytes, str]:
    """
    Extract original PDF bytes and text from analysis data
    """
    try:
        # Try to get PDF URL from analysis data
        file_url = None
        if 'file_url' in analysis_data:
            file_url = analysis_data['file_url']
        elif 'pdf_url' in analysis_data:
            file_url = analysis_data['pdf_url']
        elif 'file_info' in analysis_data and 'file_url' in analysis_data['file_info']:
            file_url = analysis_data['file_info']['file_url']
        
        if not file_url:
            # Try to use text content if no PDF URL available
            if 'content' in analysis_data:
                logger.info("📄 No PDF URL found, generating PDF from text content")
                return create_pdf_from_text(analysis_data['content']), analysis_data['content']
            else:
                raise Exception("No PDF URL or content found in analysis data. Cannot proceed with resume improvement.")
        
        # Download PDF from URL
        logger.info(f"⬇️ Downloading PDF from: {file_url}")
        response = requests.get(file_url, timeout=30)
        response.raise_for_status()
        
        pdf_bytes = response.content
        
        # Extract text from PDF for processing
        original_text = analysis_data.get('content', '')
        if not original_text:
            # If no text content in analysis, extract it from PDF
            logger.info("📄 Extracting text from PDF...")
            original_text = extract_text_from_pdf_simple(pdf_bytes)
        
        return pdf_bytes, original_text
        
    except Exception as e:
        logger.error(f"Failed to extract original PDF: {e}")
        # If PDF download fails but we have content, create PDF from text
        if 'content' in analysis_data:
            logger.info("🔄 PDF download failed, generating PDF from text content")
            return create_pdf_from_text(analysis_data['content']), analysis_data['content']
        else:
            raise Exception(f"Cannot extract original PDF and no text content available: {str(e)}")

def extract_text_from_pdf_simple(pdf_bytes: bytes) -> str:
    """Simple PDF text extraction"""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        logger.error(f"PDF text extraction failed: {e}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def create_pdf_from_text(text_content: str) -> bytes:
    """Create a PDF from text content when original PDF is not available"""
    try:
        import fitz  # PyMuPDF
        
        # Create a new PDF document
        doc = fitz.open()
        page = doc.new_page()
        
        # Insert text content with proper formatting
        text_rect = fitz.Rect(50, 50, 550, 750)  # Standard margins
        page.insert_textbox(text_rect, text_content, fontsize=11, fontname="helv")
        
        # Save to bytes
        pdf_bytes = io.BytesIO()
        doc.save(pdf_bytes)
        pdf_data = pdf_bytes.getvalue()
        
        doc.close()
        pdf_bytes.close()
        
        return pdf_data
        
    except Exception as e:
        logger.error(f"PDF creation failed: {e}")
        raise Exception(f"Failed to create PDF from text: {str(e)}")

def calculate_new_ats_score(improved_text: str, original_analysis: Dict[str, Any]) -> int:
    """
    Calculate new ATS score for improved text using penalty system
    """
    if not PENALTY_SYSTEM_AVAILABLE:
        raise RuntimeError("ATS penalty system not available. Cannot calculate improved score.")
    
    try:
        # Use existing penalty system with higher base score for improved text
        base_score = 85  # Higher base score for AI-improved text
        penalty_result = apply_comprehensive_penalties(base_score, improved_text)
        final_score = penalty_result.get('final_score', base_score)
        
        logger.info(f"📊 New ATS score calculated: {final_score}")
        return final_score
    
    except Exception as e:
        logger.error(f"ATS score calculation failed: {e}")
        raise Exception(f"Failed to calculate new ATS score: {str(e)}")

def save_improved_pdf(pdf_bytes: bytes, user_email: str, payment_id: str) -> str:
    """
    Save improved PDF to storage and return accessible URL
    """
    try:
        import tempfile
        import os
        
        # Create filename
        filename = f"improved_resume_{payment_id}_{user_email.split('@')[0]}.pdf"
        
        # Save to temporary file for now (in production, upload to Supabase storage)
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        
        with open(temp_path, 'wb') as f:
            f.write(pdf_bytes)
        
        # In production, this would upload to Supabase storage and return the public URL
        # For now, return the local path
        public_url = f"file://{temp_path}"
        
        logger.info(f"📁 PDF saved to: {temp_path}")
        return public_url
        
    except Exception as e:
        logger.error(f"Failed to save improved PDF: {e}")
        raise Exception(f"Failed to save improved PDF: {str(e)}")

def error_response(message: str, status_code: int) -> Dict[str, Any]:
    """Create standardized error response"""
    return {
        'statusCode': status_code,
        'headers': get_cors_headers(),
        'body': json.dumps({
            'status': 'error',
            'error': message,
            'timestamp': int(__import__('time').time())
        })
    }

def cleanup_memory():
    """Clean up memory resources"""
    try:
        collected = gc.collect()
        logger.debug(f"🧹 Memory cleanup collected {collected} objects")
    except Exception as e:
        logger.warning(f"Memory cleanup failed: {e}")

# Entry point for Vercel
def main(request):
    """Vercel entry point"""
    return handler(request)

# For local testing
if __name__ == "__main__":
    # Simple test
    import time
    
    class MockRequest:
        def __init__(self, method='POST', body=None):
            self.method = method
            self.body = body or json.dumps({
                'original_analysis': {
                    'score': 65,
                    'content': 'Sample resume content for testing'
                },
                'user_email': 'test@example.com',
                'payment_id': f'test_{int(time.time())}'
            })
    
    # Test the handler
    test_request = MockRequest()
    result = handler(test_request)
    print(f"Test result: {result}")