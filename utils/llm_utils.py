"""
LLM Integration Utilities for Resume Text Improvement
Uses Gemini Flash 2.0 for AI-powered resume enhancement based on ATS feedback.
Integrates with existing Gemini client from cv-optimizer.
"""

import logging
import os
import sys
import json
from typing import List, Dict, Any, Optional
import re

logger = logging.getLogger(__name__)

# Import Gemini client from cv-optimizer
try:
    # Add cv-optimizer path for imports
    cv_optimizer_path = os.path.join(os.path.dirname(__file__), '..', 'api', 'cv-optimizer')
    sys.path.append(cv_optimizer_path)
    
    from gemini_client import GeminiOptimizer, OptimizationResult
    GEMINI_AVAILABLE = True
    logger.info("✅ Gemini Flash 2.0 client loaded successfully")
except ImportError as e:
    GEMINI_AVAILABLE = False
    logger.warning(f"⚠️ Gemini client not available: {e}")

# Gemini API key
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

def improve_resume_with_llm(resume_text: str, feedback_list: List[str]) -> str:
    """
    Use Gemini Flash 2.0 to improve resume text based on ATS feedback.
    
    Args:
        resume_text: Original resume text content
        feedback_list: List of specific feedback issues to address
        
    Returns:
        Improved resume text addressing the feedback
        
    Raises:
        RuntimeError: If Gemini API is not available or fails
    """
    logger.info(f"🧠 Improving resume with Gemini Flash 2.0 - {len(feedback_list)} feedback items")
    
    if not GEMINI_AVAILABLE:
        raise RuntimeError("Gemini AI library not available. Please install google-generativeai package.")
    
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY environment variable not set. AI resume improvement requires valid API key.")
    
    # Initialize Gemini optimizer
    optimizer = GeminiOptimizer(api_key=GEMINI_API_KEY)
    
    # Create a comprehensive prompt for resume improvement
    improvement_prompt = _create_resume_improvement_prompt(resume_text, feedback_list)
    
    # Make Gemini request
    response_text, cost_info = optimizer._make_gemini_request(improvement_prompt, max_tokens=2500)
    
    if not response_text or len(response_text.strip()) < 50:
        raise RuntimeError("Gemini API returned empty or invalid response")
    
    logger.info(f"💰 Gemini cost: ${cost_info.estimated_cost_usd:.4f}")
    logger.info(f"📊 Tokens - Input: {cost_info.input_tokens}, Output: {cost_info.output_tokens}")
    
    # Parse and format the response
    improved_text = _parse_gemini_improvement_response(response_text, resume_text)
    
    if len(improved_text) < len(resume_text) * 0.5:
        raise RuntimeError("Gemini response was too short or invalid. Resume improvement failed.")
    
    logger.info(f"✅ Gemini improvement complete: {len(improved_text)} characters")
    return improved_text


def _create_resume_improvement_prompt(resume_text: str, feedback_list: List[str]) -> str:
    """Create comprehensive prompt for Gemini resume improvement"""
    feedback_text = "\n".join([f"- {feedback}" for feedback in feedback_list])
    
    prompt = f"""You are an expert resume optimization specialist. Your task is to improve the following resume to address specific ATS (Applicant Tracking System) issues while maintaining the original structure and formatting.

## ORIGINAL RESUME:
{resume_text}

## ATS ISSUES TO FIX:
{feedback_text}

## IMPROVEMENT INSTRUCTIONS:
1. **Maintain Original Structure**: Keep the same sections, order, and basic formatting
2. **Address Each Issue**: Systematically fix every listed ATS issue
3. **Quantify Achievements**: Add numbers, percentages, and metrics where missing
4. **Use Action Verbs**: Replace passive language with strong action verbs
5. **Add Strategic Keywords**: Include relevant industry and role-specific keywords naturally
6. **Improve Readability**: Ensure clear, professional, and ATS-friendly language
7. **Preserve Personal Information**: Keep names, contact details, and company names exactly as provided

## SPECIFIC IMPROVEMENTS NEEDED:
- If "measurable achievements" is mentioned: Add specific numbers, percentages, dollar amounts
- If "action verbs" or "passive tone" is mentioned: Use strong action verbs (achieved, implemented, optimized, etc.)
- If "keywords" is mentioned: Add relevant industry-specific terms naturally
- If "professional summary" is mentioned: Create or enhance summary with key achievements
- If "soft skills" is mentioned: Replace generic soft skills with specific technical skills

## OUTPUT FORMAT:
Return ONLY the improved resume text, maintaining the exact same structure and sections as the original. Do not add explanations, comments, or additional formatting markers.

IMPROVED RESUME:"""

    return prompt

def _parse_gemini_improvement_response(response_text: str, original_text: str) -> str:
    """Parse and clean Gemini's improvement response"""
    try:
        # Clean the response
        improved_text = response_text.strip()
        
        # Remove any markdown formatting or explanations
        improved_text = re.sub(r'^```.*$', '', improved_text, flags=re.MULTILINE)
        improved_text = re.sub(r'^#.*$', '', improved_text, flags=re.MULTILINE)
        
        # Remove any leading/trailing explanatory text
        lines = improved_text.split('\n')
        start_idx = 0
        end_idx = len(lines)
        
        # Find where the actual resume content starts
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in ['name', 'contact', 'email', 'phone', 'experience', 'education', 'skills']):
                start_idx = i
                break
        
        # Extract the improved resume content
        improved_lines = lines[start_idx:end_idx]
        final_text = '\n'.join(improved_lines).strip()
        
        # Ensure we have substantial content
        if len(final_text) < len(original_text) * 0.5:
            raise RuntimeError(f"Gemini response too short: {len(final_text)} chars vs {len(original_text)} expected")
        
        return final_text
        
    except Exception as e:
        logger.error(f"❌ Failed to parse Gemini response: {e}")
        raise RuntimeError(f"Failed to parse Gemini response: {str(e)}")


def generate_feedback_from_analysis(analysis_data: Dict[str, Any]) -> List[str]:
    """
    Convert ATS analysis data into specific feedback for Gemini improvement
    
    Args:
        analysis_data: Analysis results from ATS scoring system
        
    Returns:
        List of specific feedback items for improvement
    """
    feedback_list = []
    
    try:
        # Extract penalty information if available
        if 'penalties_applied' in analysis_data:
            for penalty in analysis_data['penalties_applied']:
                feedback_list.append(penalty.get('reason', 'General improvement needed'))
        
        # Extract component analysis if available
        if 'components' in analysis_data:
            components = analysis_data['components']
            
            if components.get('keywords_score', 100) < 70:
                feedback_list.append("Lacks industry-specific keywords and technical terms")
            
            if components.get('experience_score', 100) < 70:
                feedback_list.append("Lacks measurable achievements and quantifiable results")
            
            if components.get('structure_score', 100) < 70:
                feedback_list.append("Resume structure needs optimization for ATS parsing")
        
        # Generic feedback if no specific issues found
        if not feedback_list:
            score = analysis_data.get('score', analysis_data.get('ats_score', 50))
            if score < 70:
                feedback_list.extend([
                    "Avoid passive tone and use strong action verbs",
                    "Add quantifiable achievements with specific numbers",
                    "Include more industry-relevant keywords",
                    "Optimize formatting for ATS compatibility"
                ])
        
        logger.info(f"📋 Generated {len(feedback_list)} feedback items from analysis")
        return feedback_list
        
    except Exception as e:
        logger.error(f"❌ Error generating feedback: {e}")
        # Return minimal feedback for Gemini to work with
        return [
            "Improve resume content for better ATS compatibility",
            "Add quantifiable achievements and metrics", 
            "Use strong action verbs and professional language"
        ]