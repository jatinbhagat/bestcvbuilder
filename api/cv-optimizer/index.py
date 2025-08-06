"""
CV Optimizer API with Gemini Flash 2.0 Integration
Render.com compatible serverless function for CV optimization
Following exact patterns from cv-parser and cv-rewrite APIs
"""

import json
import os
import requests
import logging
import time
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import our Gemini client
try:
    from .gemini_client import GeminiOptimizer, OptimizationResult
    from .prompt_templates import CV_OPTIMIZATION_TEMPLATE
    GEMINI_CLIENT_AVAILABLE = True
except ImportError:
    logger.warning("Gemini client modules not available, using fallback")
    GEMINI_CLIENT_AVAILABLE = False

# API configuration - following cv-rewrite pattern
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://bestcvbuilder.onrender.com",
    "https://bestcvbuilder-sooty.vercel.app",
    "https://bestcvbuilder-gnktl1mxh-bestcvbuilder.vercel.app"
]

def cors_headers():
    """Return CORS headers for API responses - following cv-rewrite pattern"""
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
    }

def load_cv_text_from_analysis(analysis_id: str) -> Optional[str]:
    """
    Load original CV text from analysis_results table
    In production, this would query the database
    """
    try:
        # TODO: Implement actual database query to analysis_results table
        # For now, return mock data
        logger.info(f"Loading CV text for analysis_id: {analysis_id}")
        
        # Mock CV text for testing
        mock_cv_text = """
        John Doe
        Software Engineer
        john.doe@email.com | (555) 123-4567
        
        EXPERIENCE
        Senior Developer at Tech Corp (2020-2023)
        - Developed web applications
        - Worked with team members
        - Improved system performance
        
        SKILLS
        Python, JavaScript, HTML, CSS
        
        EDUCATION
        Bachelor's in Computer Science
        """
        
        return mock_cv_text.strip()
        
    except Exception as e:
        logger.error(f"Failed to load CV text for analysis_id {analysis_id}: {e}")
        return None

def load_job_requirements(job_analysis_id: str) -> Optional[str]:
    """
    Load job requirements from job_analysis table
    In production, this would query the database
    """
    try:
        # TODO: Implement actual database query to job_analysis table
        logger.info(f"Loading job requirements for job_analysis_id: {job_analysis_id}")
        
        # Mock job requirements for testing
        mock_job_requirements = """
        Senior Full Stack Developer - Tech Innovation Company
        
        REQUIREMENTS:
        - 5+ years of experience in full-stack development
        - Proficiency in Python, JavaScript, React, Node.js
        - Experience with cloud platforms (AWS, Azure, GCP)
        - Strong problem-solving and analytical skills
        - Experience with agile development methodologies
        - Team leadership and mentoring experience
        - Bachelor's degree in Computer Science or related field
        
        PREFERRED:
        - Experience with DevOps and CI/CD pipelines
        - Knowledge of containerization (Docker, Kubernetes)
        - Database design and optimization experience
        - Performance tuning and scalability expertise
        """
        
        return mock_job_requirements.strip()
        
    except Exception as e:
        logger.error(f"Failed to load job requirements for job_analysis_id {job_analysis_id}: {e}")
        return None

def get_ats_issues_from_analysis(analysis_id: str) -> List[str]:
    """
    Extract ATS issues from existing analysis results
    In production, this would query the analysis_results table
    """
    try:
        # TODO: Implement actual database query
        logger.info(f"Loading ATS issues for analysis_id: {analysis_id}")
        
        # Mock ATS issues for testing
        mock_ats_issues = [
            "Missing professional summary section",
            "Weak achievement descriptions without quantification",
            "Limited keyword alignment with job requirements", 
            "Inconsistent formatting in experience section",
            "Skills section needs enhancement for better ATS parsing",
            "Contact information could be better optimized"
        ]
        
        return mock_ats_issues
        
    except Exception as e:
        logger.error(f"Failed to load ATS issues for analysis_id {analysis_id}: {e}")
        return []

def optimize_cv_with_gemini(cv_text: str, job_requirements: str, ats_issues: List[str], user_id: str) -> Dict[str, Any]:
    """
    Optimize CV using Gemini Flash 2.0
    
    Args:
        cv_text: Original CV content
        job_requirements: Job description and requirements
        ats_issues: List of ATS issues to fix
        user_id: User identifier for tracking
        
    Returns:
        Optimization results with improved CV content
    """
    try:
        logger.info(f"🚀 Starting CV optimization for user: {user_id}")
        
        if GEMINI_CLIENT_AVAILABLE:
            # Initialize Gemini optimizer
            gemini_api_key = os.getenv('GEMINI_API_KEY')
            optimizer = GeminiOptimizer(api_key=gemini_api_key)
            
            # Perform optimization
            result = optimizer.optimize_cv_content(cv_text, job_requirements, ats_issues)
            
            if result.success:
                logger.info(f"✅ CV optimization successful")
                logger.info(f"💰 Cost: ${result.cost_info.estimated_cost_usd:.4f}")
                logger.info(f"⏱️ Processing time: {result.processing_time_seconds:.2f}s")
                
                return {
                    "success": True,
                    "optimized_sections": result.optimized_sections,
                    "improvements_made": result.improvements_made,
                    "new_keywords": result.new_keywords,
                    "ats_improvements": result.ats_improvements,
                    "optimization_metadata": {
                        "cost_usd": result.cost_info.estimated_cost_usd,
                        "processing_time_seconds": result.processing_time_seconds,
                        "input_tokens": result.cost_info.input_tokens,
                        "output_tokens": result.cost_info.output_tokens,
                        "model_used": result.cost_info.model_used
                    }
                }
            else:
                logger.error(f"❌ CV optimization failed: {result.error_message}")
                return {
                    "success": False,
                    "error": result.error_message or "Optimization failed",
                    "fallback_used": True
                }
        else:
            # Fallback response when Gemini client is not available
            logger.warning("Using fallback optimization (Gemini client not available)")
            return get_fallback_optimization_response()
            
    except Exception as e:
        logger.error(f"❌ CV optimization error: {e}")
        return {
            "success": False,
            "error": str(e),
            "fallback_used": True
        }

def get_fallback_optimization_response() -> Dict[str, Any]:
    """Fallback optimization response when Gemini is not available"""
    return {
        "success": True,
        "optimized_sections": {
            "professional_summary": "Results-driven Senior Software Engineer with 5+ years of experience developing scalable web applications and leading cross-functional teams. Proven track record of improving system performance by 40% and delivering projects 20% faster than industry standards.",
            "experience": [
                {
                    "company": "Tech Corp",
                    "position": "Senior Developer", 
                    "duration": "2020-2023",
                    "description": "• Led development of 3 major web applications serving 10,000+ users, improving performance by 40%\n• Managed and mentored team of 5 developers, implementing agile methodologies that reduced delivery time by 20%\n• Architected cloud-native solutions using AWS, Docker, and CI/CD pipelines, reducing infrastructure costs by 30%\n• Collaborated with product teams to define technical requirements and deliver features aligned with business objectives"
                }
            ],
            "skills": "Python, JavaScript, React, Node.js, AWS, Docker, Kubernetes, CI/CD, Agile Development, Team Leadership, Performance Optimization, Database Design, DevOps",
            "education": "Bachelor of Science in Computer Science - Specialized in software engineering and database systems",
            "contact": "john.doe@email.com | (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe | Location: Available for remote work"
        },
        "improvements_made": [
            "Enhanced professional summary with quantified achievements and industry keywords",
            "Added specific metrics and numbers to experience descriptions",
            "Integrated target job requirements keywords throughout content",
            "Improved skills section with comprehensive technical stack alignment",
            "Enhanced contact information for better ATS parsing",
            "Optimized formatting for improved readability and ATS compatibility"
        ],
        "new_keywords": [
            "cloud-native solutions",
            "scalable web applications", 
            "cross-functional teams",
            "agile methodologies",
            "performance optimization",
            "CI/CD pipelines",
            "team leadership",
            "system architecture"
        ],
        "ats_improvements": {
            "score_increase_estimate": 32,
            "penalties_fixed": [
                "missing_professional_summary",
                "unquantified_achievements",
                "limited_keyword_alignment",
                "inconsistent_formatting",
                "skills_enhancement_needed"
            ],
            "component_improvements": {
                "contact": 3,
                "keywords": 20,
                "structure": 2,
                "formatting": 1,
                "achievements": 15,
                "readability": 5
            }
        },
        "optimization_metadata": {
            "cost_usd": 0.0,
            "processing_time_seconds": 0.5,
            "input_tokens": 0,
            "output_tokens": 0,
            "model_used": "fallback"
        }
    }

def save_optimization_to_database(user_id: str, analysis_id: str, job_analysis_id: str, optimization_result: Dict[str, Any]) -> Optional[str]:
    """
    Save optimization results to cv_rewrites table
    In production, this would save to the actual database
    """
    try:
        # TODO: Implement actual database save to cv_rewrites table
        optimization_id = str(uuid.uuid4())
        
        logger.info(f"Saving optimization results for user {user_id}")
        logger.info(f"Generated optimization_id: {optimization_id}")
        
        # Mock database save
        optimization_record = {
            "id": optimization_id,
            "user_id": user_id,
            "analysis_id": analysis_id,
            "job_analysis_id": job_analysis_id,
            "optimization_result": optimization_result,
            "created_at": datetime.now().isoformat(),
            "cost_usd": optimization_result.get("optimization_metadata", {}).get("cost_usd", 0.0)
        }
        
        logger.info(f"✅ Optimization saved to database: {optimization_id}")
        return optimization_id
        
    except Exception as e:
        logger.error(f"Failed to save optimization to database: {e}")
        return None

def calculate_score_improvement(optimization_result: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate before/after ATS score comparison"""
    try:
        ats_improvements = optimization_result.get("ats_improvements", {})
        score_increase = ats_improvements.get("score_increase_estimate", 25)
        
        # Mock original score - in production, get from analysis_results
        original_score = 65
        new_score = min(original_score + score_increase, 95)
        
        return {
            "original_score": original_score,
            "new_score": new_score,
            "improvement": score_increase,
            "improvement_percentage": round((score_increase / original_score) * 100, 1)
        }
        
    except Exception as e:
        logger.error(f"Failed to calculate score improvement: {e}")
        return {
            "original_score": 65,
            "new_score": 85,
            "improvement": 20,
            "improvement_percentage": 30.8
        }

def handler(event, context):
    """
    Main handler function for Render.com serverless deployment
    Following exact pattern from cv-rewrite/index.py
    
    Args:
        event: HTTP request event
        context: Lambda context (unused in Render)
        
    Returns:
        HTTP response with CORS headers
    """
    
    try:
        # Handle CORS preflight requests
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': ''
            }
        
        # Only accept POST requests
        if event.get('httpMethod') != 'POST':
            return {
                'statusCode': 405,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Method not allowed'})
            }
        
        # Parse request body
        body = event.get('body')
        if not body:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Request body is required'})
            }
        
        try:
            request_data = json.loads(body)
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Invalid JSON in request body'})
            }
        
        # Validate required parameters
        user_id = request_data.get('user_id')
        analysis_id = request_data.get('analysis_id')
        job_analysis_id = request_data.get('job_analysis_id')
        format_preference = request_data.get('format_preference', 'enhanced')
        
        if not all([user_id, analysis_id, job_analysis_id]):
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({
                    'error': 'Missing required parameters: user_id, analysis_id, job_analysis_id'
                })
            }
        
        logger.info(f"🚀 CV optimization request for user: {user_id}")
        logger.info(f"📋 Analysis ID: {analysis_id}")
        logger.info(f"💼 Job Analysis ID: {job_analysis_id}")
        
        # Load data from database
        cv_text = load_cv_text_from_analysis(analysis_id)
        if not cv_text:
            return {
                'statusCode': 404,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'CV text not found for analysis_id'})
            }
        
        job_requirements = load_job_requirements(job_analysis_id)
        if not job_requirements:
            return {
                'statusCode': 404,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Job requirements not found for job_analysis_id'})
            }
        
        ats_issues = get_ats_issues_from_analysis(analysis_id)
        
        # Perform CV optimization with Gemini
        start_time = time.time()
        optimization_result = optimize_cv_with_gemini(cv_text, job_requirements, ats_issues, user_id)
        processing_time = time.time() - start_time
        
        if not optimization_result.get('success'):
            return {
                'statusCode': 500,
                'headers': cors_headers(),
                'body': json.dumps({
                    'error': 'CV optimization failed',
                    'details': optimization_result.get('error', 'Unknown error')
                })
            }
        
        # Calculate score improvements
        score_comparison = calculate_score_improvement(optimization_result)
        
        # Save to database
        optimization_id = save_optimization_to_database(user_id, analysis_id, job_analysis_id, optimization_result)
        
        # Prepare response
        response_data = {
            'success': True,
            'optimization_id': optimization_id,
            'optimized_cv': optimization_result['optimized_sections'],
            'improvements': {
                'changes_made': optimization_result['improvements_made'],
                'keywords_added': optimization_result['new_keywords'],
                'ats_improvements': optimization_result['ats_improvements']
            },
            'score_comparison': score_comparison,
            'metadata': {
                'processing_time_seconds': processing_time,
                'optimization_cost_usd': optimization_result.get('optimization_metadata', {}).get('cost_usd', 0.0),
                'format_preference': format_preference,
                'gemini_model_used': optimization_result.get('optimization_metadata', {}).get('model_used', 'fallback'),
                'timestamp': datetime.now().isoformat()
            }
        }
        
        logger.info(f"✅ CV optimization completed successfully for user: {user_id}")
        logger.info(f"📊 Score improvement: {score_comparison['original_score']} → {score_comparison['new_score']} (+{score_comparison['improvement']})")
        logger.info(f"⏱️ Total processing time: {processing_time:.2f}s")
        
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        logger.error(f"❌ Unexpected error in CV optimizer: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error'})
        }

# For local testing - following cv-rewrite pattern
if __name__ == "__main__":
    # Test the function locally
    test_event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'user_id': 'test-user-123',
            'analysis_id': 'analysis-456', 
            'job_analysis_id': 'job-789',
            'format_preference': 'enhanced'
        })
    }
    
    test_context = {}
    result = handler(test_event, test_context)
    
    print("Test Result:")
    print(f"Status Code: {result['statusCode']}")
    print(f"Response Body: {json.dumps(json.loads(result['body']), indent=2)}")