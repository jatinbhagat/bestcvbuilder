"""
CV Parser API for ATS Analysis
Hosted on Vercel as serverless function
"""

import json
import os
import requests
from typing import Dict, Any, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API configuration
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-domain.com",  # Replace with your actual domain
]

def cors_headers():
    """Return CORS headers for API responses"""
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

def analyze_resume_content(file_url: str) -> Dict[str, Any]:
    """
    Analyze resume content and return ATS score and recommendations
    
    Args:
        file_url: URL of the uploaded resume file
        
    Returns:
        Dictionary containing analysis results
    """
    try:
        # Download the file from the URL
        response = requests.get(file_url)
        response.raise_for_status()
        
        # Extract text content from the file
        # This is a simplified version - in production you'd use proper PDF/DOCX parsing
        content = extract_text_from_file(response.content, file_url)
        
        # Analyze the content
        analysis_result = perform_ats_analysis(content)
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        raise

def extract_text_from_file(file_content: bytes, file_url: str) -> str:
    """
    Extract text content from uploaded file
    
    Args:
        file_content: Raw file content
        file_url: Original file URL for determining file type
        
    Returns:
        Extracted text content
    """
    # This is a placeholder implementation
    # In production, you'd use libraries like:
    # - PyPDF2 or pdfplumber for PDF files
    # - python-docx for DOCX files
    # - python-docx2txt for DOC files
    
    file_extension = file_url.split('.')[-1].lower()
    
    if file_extension == 'pdf':
        # Placeholder for PDF text extraction
        return "Sample resume content extracted from PDF"
    elif file_extension in ['docx', 'doc']:
        # Placeholder for Word document text extraction
        return "Sample resume content extracted from Word document"
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")

def perform_ats_analysis(content: str) -> Dict[str, Any]:
    """
    Perform ATS analysis on resume content
    
    Args:
        content: Extracted text content from resume
        
    Returns:
        Analysis results with score and recommendations
    """
    # This is a simplified analysis
    # In production, you'd use more sophisticated NLP and ATS algorithms
    
    # Calculate ATS score based on various factors
    score = calculate_ats_score(content)
    
    # Generate recommendations
    strengths, improvements = generate_recommendations(content, score)
    
    # Extract keywords
    keywords = extract_keywords(content)
    
    # Identify missing keywords
    missing_keywords = identify_missing_keywords(content)
    
    # Check formatting issues
    formatting_issues = check_formatting_issues(content)
    
    return {
        "ats_score": score,
        "strengths": strengths,
        "improvements": improvements,
        "keywords": keywords,
        "missing_keywords": missing_keywords,
        "formatting_issues": formatting_issues,
        "detailed_analysis": generate_detailed_analysis(content, score),
        "suggestions": generate_suggestions(content, score)
    }

def calculate_ats_score(content: str) -> int:
    """
    Calculate ATS compatibility score (0-100)
    
    Args:
        content: Resume content
        
    Returns:
        ATS score (0-100)
    """
    score = 50  # Base score
    
    # Check for important resume elements
    if "experience" in content.lower():
        score += 10
    if "education" in content.lower():
        score += 10
    if "skills" in content.lower():
        score += 10
    if "achievement" in content.lower() or "accomplishment" in content.lower():
        score += 10
    if len(content.split()) > 200:  # Sufficient content length
        score += 10
    
    # Check for action verbs
    action_verbs = ["managed", "developed", "created", "implemented", "led", "achieved"]
    for verb in action_verbs:
        if verb in content.lower():
            score += 2
    
    return min(score, 100)  # Cap at 100

def generate_recommendations(content: str, score: int) -> tuple[List[str], List[str]]:
    """
    Generate strengths and improvement recommendations
    
    Args:
        content: Resume content
        score: Current ATS score
        
    Returns:
        Tuple of (strengths, improvements)
    """
    strengths = []
    improvements = []
    
    # Analyze strengths
    if "experience" in content.lower():
        strengths.append("Good use of experience section")
    if "skills" in content.lower():
        strengths.append("Skills section present")
    if len(content.split()) > 200:
        strengths.append("Adequate content length")
    
    # Analyze improvements
    if score < 70:
        improvements.append("Add more industry-specific keywords")
    if "achievement" not in content.lower():
        improvements.append("Include quantifiable achievements")
    if len(content.split()) < 200:
        improvements.append("Expand content with more details")
    
    return strengths, improvements

def extract_keywords(content: str) -> List[str]:
    """
    Extract relevant keywords from resume content
    
    Args:
        content: Resume content
        
    Returns:
        List of extracted keywords
    """
    # This is a simplified keyword extraction
    # In production, you'd use NLP libraries like spaCy or NLTK
    
    common_keywords = [
        "project management", "leadership", "analysis", "development",
        "communication", "teamwork", "problem solving", "strategy",
        "planning", "coordination", "research", "design"
    ]
    
    found_keywords = []
    for keyword in common_keywords:
        if keyword in content.lower():
            found_keywords.append(keyword)
    
    return found_keywords

def identify_missing_keywords(content: str) -> List[str]:
    """
    Identify potentially missing keywords
    
    Args:
        content: Resume content
        
    Returns:
        List of suggested keywords
    """
    # This would be more sophisticated in production
    # You'd analyze job descriptions and industry trends
    
    suggested_keywords = [
        "agile", "scrum", "stakeholder management", "data analysis",
        "process improvement", "cross-functional", "collaboration"
    ]
    
    missing_keywords = []
    for keyword in suggested_keywords:
        if keyword not in content.lower():
            missing_keywords.append(keyword)
    
    return missing_keywords

def check_formatting_issues(content: str) -> List[str]:
    """
    Check for common formatting issues
    
    Args:
        content: Resume content
        
    Returns:
        List of formatting issues
    """
    issues = []
    
    # Check for common formatting problems
    if "  " in content:  # Double spaces
        issues.append("Remove extra spaces")
    if "\t" in content:  # Tabs
        issues.append("Replace tabs with spaces")
    
    return issues

def generate_detailed_analysis(content: str, score: int) -> str:
    """
    Generate detailed analysis text
    
    Args:
        content: Resume content
        score: ATS score
        
    Returns:
        Detailed analysis text
    """
    if score >= 80:
        return "Your resume shows excellent ATS compatibility with good structure and relevant keywords."
    elif score >= 60:
        return "Your resume has good potential but could benefit from more targeted keywords and quantifiable achievements."
    else:
        return "Your resume needs significant optimization for ATS systems. Focus on adding relevant keywords and improving structure."

def generate_suggestions(content: str, score: int) -> List[Dict[str, str]]:
    """
    Generate specific improvement suggestions
    
    Args:
        content: Resume content
        score: ATS score
        
    Returns:
        List of suggestion objects
    """
    suggestions = []
    
    if score < 70:
        suggestions.append({
            "title": "Add Quantifiable Achievements",
            "description": "Include specific numbers and metrics to demonstrate impact",
            "priority": "high"
        })
    
    if "skills" not in content.lower():
        suggestions.append({
            "title": "Add Skills Section",
            "description": "Include a dedicated skills section with relevant keywords",
            "priority": "medium"
        })
    
    return suggestions

def handler(event, context):
    """
    Main handler function for Vercel serverless function
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API response
    """
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': ''
        }
    
    # Only allow POST requests
    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        file_url = body.get('file_url')
        analysis_type = body.get('analysis_type', 'ats_score')
        include_recommendations = body.get('include_recommendations', True)
        
        if not file_url:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'file_url is required'})
            }
        
        # Perform analysis
        analysis_result = analyze_resume_content(file_url)
        
        # Return results
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(analysis_result)
        }
        
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error'})
        }

# For local testing
if __name__ == "__main__":
    # Test the function locally
    test_event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'file_url': 'https://example.com/test-resume.pdf',
            'analysis_type': 'ats_score',
            'include_recommendations': True
        })
    }
    
    result = handler(test_event, None)
    print(json.dumps(result, indent=2)) 