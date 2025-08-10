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

def improve_resume_with_llm(resume_text: str, feedback_list: List[str], ats_score: int = 65) -> str:
    """
    Use Gemini Flash 2.0 to improve resume text based on ATS feedback with score-based strategy.
    
    Args:
        resume_text: Original resume text content
        feedback_list: List of specific feedback issues to address
        ats_score: ATS score (0-100) to determine improvement strategy
        
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
    print(f"📝 LLM-UTILS: Creating improvement prompt for ATS score: {ats_score}")
    improvement_prompt = _create_resume_improvement_prompt(resume_text, feedback_list, ats_score)
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
    
    if len(improved_text) < len(resume_text) * 0.7:
        print(f"❌ LLM-UTILS: Improved text too short: {len(improved_text)} vs {len(resume_text)}")
        raise RuntimeError(f"Gemini response was too short: {len(improved_text)} chars (need at least 70% of {len(resume_text)}). Resume improvement failed.")
    
    print(f"🎉 LLM-UTILS: Gemini improvement completed successfully!")
    logger.info(f"✅ Gemini improvement complete: {len(improved_text)} characters")
    return improved_text


def _create_resume_improvement_prompt(resume_text: str, feedback_list: List[str], ats_score: int) -> str:
    """Create comprehensive prompt for Gemini resume improvement based on ATS score strategy"""
    feedback_text = "\n".join([f"- {feedback}" for feedback in feedback_list])
    
    # Determine strategy based on ATS score
    if ats_score >= 70:
        strategy = "Minor Fix"
        instructions = """
**MINOR FIX APPROACH (ATS Score ≥ 70):**
- Keep the same structure, tone, and formatting as the original CV
- Fix only the specific issues from ATS feedback
- Add missing keywords naturally without keyword stuffing
- Ensure grammar, clarity, and tense consistency
- Preserve all achievements and details exactly as written
- Make minimal changes while addressing feedback points"""
        
    elif ats_score <= 60:
        strategy = "Major Overhaul"
        instructions = """
**MAJOR OVERHAUL APPROACH (ATS Score ≤ 60):**
- Rewrite into a clean, modern, ATS-friendly format
- Organize sections logically: Professional Summary, Core Skills, Professional Experience, Education, Key Achievements
- Include all key details from the original CV but improve presentation
- Use concise bullet points with measurable outcomes
- Add strong action verbs and quantifiable results
- Ensure comprehensive ATS keyword coverage
- Create professional summary highlighting key qualifications
- Structure each role with clear achievements and impact"""
        
    else:  # 60-69
        strategy = "Hybrid Approach"
        instructions = """
**HYBRID APPROACH (ATS Score 60-69):**
- Preserve professional tone and style but reorganize sections for better ATS parsing
- Improve headings, section ordering, and overall structure
- Add missing keywords and fill content gaps
- Keep strong sections largely unchanged
- Enhance weak areas with better formatting and content
- Balance preservation of original style with ATS optimization"""
    
    prompt = f"""You are an expert ATS resume optimizer. Your CRITICAL task is to improve the CV while PRESERVING ALL ORIGINAL CONTENT.

**ABSOLUTELY CRITICAL REQUIREMENTS:**
1. PRESERVE ALL job titles, company names, dates, and achievements from original
2. PRESERVE ALL skills, certifications, education details, and contact information
3. PRESERVE ALL bullet points and accomplishments - DO NOT delete any content
4. PRESERVE ALL quantifiable metrics, numbers, percentages, and results
5. Only IMPROVE language, structure, and add missing ATS keywords - NEVER remove content

**CURRENT STRATEGY: {strategy} (ATS Score: {ats_score})**

{instructions}

## ATS FEEDBACK TO ADDRESS:
{feedback_text}

## CONTENT PRESERVATION RULES:
- Every job position from original must appear in improved version
- Every skill mentioned in original must appear in improved version  
- Every achievement and metric must be preserved
- Every education degree and certification must be included
- Every date range must be maintained exactly
- If original has incomplete sections, FILL them - don't delete them

## FORMAT REQUIREMENTS:
- Use clear section headers (PROFESSIONAL SUMMARY, PROFESSIONAL EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS)
- Maintain chronological order for experience
- Use bullet points for achievements under each job
- Keep plain text format suitable for PDF conversion
- NO markdown, NO explanations, NO metadata

## ORIGINAL CV TO IMPROVE:
{resume_text}

## OUTPUT INSTRUCTIONS:
Return ONLY the complete improved CV text. Include EVERY piece of information from the original CV. The improved version should be longer or same length as original - NEVER shorter.

IMPROVED CV:"""

    return prompt

def _parse_gemini_improvement_response(response_text: str, original_text: str) -> str:
    """Parse and clean Gemini's improvement response with strict content validation"""
    try:
        print(f"🔍 PARSING: Original response length: {len(response_text)}")
        
        # Clean the response
        improved_text = response_text.strip()
        
        # Remove any markdown formatting or explanations
        improved_text = re.sub(r'^```[a-zA-Z]*\n?', '', improved_text, flags=re.MULTILINE)
        improved_text = re.sub(r'^```$', '', improved_text, flags=re.MULTILINE) 
        improved_text = re.sub(r'^#{1,6}\s+.*$', '', improved_text, flags=re.MULTILINE)
        
        # Remove common explanation patterns
        improved_text = re.sub(r'^(Here is|Here\'s|Below is).*improved.*:?\s*$', '', improved_text, flags=re.MULTILINE | re.IGNORECASE)
        improved_text = re.sub(r'^IMPROVED CV:?\s*$', '', improved_text, flags=re.MULTILINE | re.IGNORECASE)
        
        # Clean up multiple blank lines
        improved_text = re.sub(r'\n\s*\n\s*\n', '\n\n', improved_text)
        improved_text = improved_text.strip()
        
        print(f"🔍 PARSING: Cleaned response length: {len(improved_text)}")
        
        # CRITICAL CONTENT VALIDATION
        original_lines = [line.strip() for line in original_text.split('\n') if line.strip()]
        improved_lines = [line.strip() for line in improved_text.split('\n') if line.strip()]
        
        print(f"🔍 PARSING: Original lines: {len(original_lines)}, Improved lines: {len(improved_lines)}")
        
        # Check for critical content preservation
        if len(improved_text) < len(original_text) * 0.7:
            print(f"❌ PARSING: Response too short - {len(improved_text)} vs {len(original_text)}")
            raise RuntimeError(f"Gemini response too short: {len(improved_text)} chars vs {len(original_text)} expected (minimum 70%)")
        
        # Validate that key resume elements are preserved
        original_lower = original_text.lower()
        improved_lower = improved_text.lower()
        
        # Check for preservation of critical elements
        critical_checks = [
            ('email address', '@' in improved_lower and '@' in original_lower),
            ('phone number', any(char.isdigit() for char in improved_text) if any(char.isdigit() for char in original_text) else True),
            ('professional experience', 'experience' in improved_lower or 'work' in improved_lower),
            ('education', 'education' in improved_lower or 'degree' in improved_lower or 'university' in improved_lower),
            ('skills', 'skills' in improved_lower or 'competenc' in improved_lower)
        ]
        
        failed_checks = [check_name for check_name, passed in critical_checks if not passed]
        if failed_checks:
            print(f"❌ PARSING: Failed critical checks: {failed_checks}")
            raise RuntimeError(f"Critical resume sections missing after improvement: {', '.join(failed_checks)}")
        
        print(f"✅ PARSING: All validation checks passed")
        return improved_text
        
    except Exception as e:
        print(f"❌ PARSING: Error parsing response: {e}")
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
        # PRIORITY 1: Use critical_issues and quick_wins from enhanced algorithm
        if 'critical_issues' in analysis_data and analysis_data['critical_issues']:
            for issue in analysis_data['critical_issues']:
                title = issue.get('title', '')
                issue_desc = issue.get('issue', '')
                if title and issue_desc:
                    feedback_list.append(f"{title}: {issue_desc}")
                elif title:
                    feedback_list.append(title)
        
        if 'quick_wins' in analysis_data and analysis_data['quick_wins']:
            for win in analysis_data['quick_wins']:
                title = win.get('title', '')
                issue_desc = win.get('issue', '')
                if title and issue_desc:
                    feedback_list.append(f"{title}: {issue_desc}")
                elif title:
                    feedback_list.append(title)
        
        # PRIORITY 2: Extract penalty information if available
        if 'penalties_applied' in analysis_data:
            for penalty in analysis_data['penalties_applied']:
                reason = penalty.get('reason', '')
                if reason and reason not in [f.split(':')[0] for f in feedback_list]:
                    feedback_list.append(reason)
        
        # PRIORITY 3: Extract component analysis if available
        if 'component_scores' in analysis_data:
            components = analysis_data['component_scores']
            
            if components.get('keywords', 100) < 15:  # Out of 20 max
                feedback_list.append("Add industry-specific keywords and technical terms throughout resume")
            
            if components.get('structure', 100) < 18:  # Out of 25 max  
                feedback_list.append("Improve resume structure and section organization for ATS parsing")
                
            if components.get('contact', 100) < 12:  # Out of 15 max
                feedback_list.append("Enhance contact information section with proper formatting")
                
            if components.get('achievements', 100) < 7:  # Out of 10 max
                feedback_list.append("Add more quantifiable achievements with specific metrics and numbers")
        
        # PRIORITY 4: Extract specific improvements from analysis
        if 'improvements' in analysis_data and analysis_data['improvements']:
            for improvement in analysis_data['improvements'][:3]:  # Top 3 improvements
                if improvement not in feedback_list:
                    feedback_list.append(improvement)
        
        # PRIORITY 5: Generic feedback based on score if nothing specific found
        if not feedback_list:
            score = analysis_data.get('score', analysis_data.get('ats_score', 50))
            if score < 70:
                feedback_list.extend([
                    "Replace passive language with strong action verbs (achieved, implemented, optimized)",
                    "Add quantifiable achievements with specific numbers, percentages, and dollar amounts",
                    "Include more industry-relevant keywords and technical skills",
                    "Optimize formatting and section structure for ATS compatibility"
                ])
        
        # Limit to top 6 feedback items for focused improvement
        feedback_list = feedback_list[:6]
        
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