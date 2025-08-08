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

# Simple Gemini client implementation to avoid import issues
try:
    import google.generativeai as genai
    GEMINI_LIB_AVAILABLE = True
except ImportError:
    GEMINI_LIB_AVAILABLE = False

class SimpleGeminiOptimizer:
    """Simple Gemini client for resume improvement"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model_name = "gemini-1.5-flash"
        
        if GEMINI_LIB_AVAILABLE and api_key:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel(self.model_name)
                self.available = True
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
                self.available = False
        else:
            self.available = False
    
    def _make_gemini_request(self, prompt: str, max_tokens: int = 2048):
        """Make request to Gemini API with cost tracking"""
        if not self.available:
            raise RuntimeError("Gemini not available - check API key and library installation")
        
        try:
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=0.1,
                top_p=0.8,
                top_k=40
            )
            
            response = self.model.generate_content(prompt, generation_config=generation_config)
            
            if response.text:
                # Simple cost estimation
                input_tokens = len(prompt.split()) * 1.3
                output_tokens = len(response.text.split()) * 1.3
                estimated_cost = ((input_tokens / 1000) * 0.00015) + ((output_tokens / 1000) * 0.0006)
                
                # Create simple cost info object
                cost_info = type('CostInfo', (), {
                    'input_tokens': int(input_tokens),
                    'output_tokens': int(output_tokens),
                    'estimated_cost_usd': estimated_cost
                })()
                
                return response.text, cost_info
            else:
                raise RuntimeError("Empty response from Gemini API")
                
        except Exception as e:
            logger.error(f"Gemini API request failed: {e}")
            raise RuntimeError(f"Gemini API request failed: {str(e)}")

# Check Gemini availability
GEMINI_AVAILABLE = GEMINI_LIB_AVAILABLE
if GEMINI_AVAILABLE:
    logger.info("✅ Gemini library available")
else:
    logger.warning("⚠️ google-generativeai library not available")

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
    print(f"🧠 LLM-UTILS: Starting Gemini improvement with {len(feedback_list)} feedback items")
    logger.info(f"🧠 Improving resume with Gemini Flash 2.0 - {len(feedback_list)} feedback items")
    
    print(f"📋 LLM-UTILS: Feedback items: {feedback_list}")
    print(f"📄 LLM-UTILS: Original text length: {len(resume_text)}")
    
    if not GEMINI_AVAILABLE:
        print(f"❌ LLM-UTILS: Gemini library not available")
        raise RuntimeError("Gemini AI library not available. Please install google-generativeai package.")
    
    print(f"✅ LLM-UTILS: Gemini library is available")
    
    if not GEMINI_API_KEY:
        print(f"❌ LLM-UTILS: Gemini API key not set")
        raise RuntimeError("GEMINI_API_KEY environment variable not set. AI resume improvement requires valid API key.")
    
    print(f"✅ LLM-UTILS: Gemini API key is set")
    
    # Initialize Gemini optimizer
    print(f"🔧 LLM-UTILS: Initializing Gemini optimizer...")
    optimizer = SimpleGeminiOptimizer(api_key=GEMINI_API_KEY)
    
    if not optimizer.available:
        print(f"❌ LLM-UTILS: Gemini optimizer not available")
        raise RuntimeError("Gemini optimizer initialization failed.")
    
    # Create a comprehensive prompt for resume improvement
    print(f"📝 LLM-UTILS: Creating improvement prompt...")
    improvement_prompt = _create_resume_improvement_prompt(resume_text, feedback_list)
    print(f"📝 LLM-UTILS: Prompt length: {len(improvement_prompt)} characters")
    
    # Make Gemini request
    print(f"🚀 LLM-UTILS: Sending request to Gemini API...")
    response_text, cost_info = optimizer._make_gemini_request(improvement_prompt, max_tokens=2500)
    
    print(f"📨 LLM-UTILS: Received response from Gemini")
    print(f"📊 LLM-UTILS: Response length: {len(response_text) if response_text else 0}")
    
    if not response_text or len(response_text.strip()) < 50:
        print(f"❌ LLM-UTILS: Gemini response too short or empty")
        raise RuntimeError("Gemini API returned empty or invalid response")
    
    print(f"💰 LLM-UTILS: Gemini cost: ${cost_info.estimated_cost_usd:.4f}")
    print(f"📊 LLM-UTILS: Tokens - Input: {cost_info.input_tokens}, Output: {cost_info.output_tokens}")
    logger.info(f"💰 Gemini cost: ${cost_info.estimated_cost_usd:.4f}")
    logger.info(f"📊 Tokens - Input: {cost_info.input_tokens}, Output: {cost_info.output_tokens}")
    
    # Parse and format the response
    print(f"🔄 LLM-UTILS: Parsing Gemini response...")
    improved_text = _parse_gemini_improvement_response(response_text, resume_text)
    print(f"✅ LLM-UTILS: Parsed improved text length: {len(improved_text)}")
    
    if len(improved_text) < len(resume_text) * 0.5:
        print(f"❌ LLM-UTILS: Improved text too short: {len(improved_text)} vs {len(resume_text)}")
        raise RuntimeError("Gemini response was too short or invalid. Resume improvement failed.")
    
    print(f"🎉 LLM-UTILS: Gemini improvement completed successfully!")
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