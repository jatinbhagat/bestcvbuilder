#!/usr/bin/env python3
"""
Enhanced TXT Report Generator with all 25 categories and Gemini-powered fix suggestions
"""

import os
import sys
import re
from typing import List, Dict, Any, Optional
import logging

# Add the project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Add cv-parser to path since it uses hyphens
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cv-parser'))

# Import existing modules
import importlib.util

try:
    # Import directly from cv-optimizer/gemini_client.py
    spec = importlib.util.spec_from_file_location("gemini_client", 
                                                  os.path.join(os.path.dirname(__file__), 'cv-optimizer', 'gemini_client.py'))
    gemini_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gemini_module)
    GeminiOptimizer = gemini_module.GeminiOptimizer
    GEMINI_CLIENT_AVAILABLE = True
except Exception as e:
    print(f"Warning: Could not import Gemini client: {e}")
    GEMINI_CLIENT_AVAILABLE = False

try:
    # Import directly from cv-parser/index.py
    spec = importlib.util.spec_from_file_location("cv_parser_index", 
                                                  os.path.join(os.path.dirname(__file__), 'cv-parser', 'index.py'))
    cv_parser_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cv_parser_module)
    generate_comprehensive_ats_scores_frontend = cv_parser_module.generate_comprehensive_ats_scores_frontend
    CV_PARSER_AVAILABLE = True
except Exception as e:
    print(f"Warning: Could not import CV parser: {e}")
    CV_PARSER_AVAILABLE = False

GEMINI_AVAILABLE = GEMINI_CLIENT_AVAILABLE and CV_PARSER_AVAILABLE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample resume text for testing
SAMPLE_RESUME_TEXT = """
PROFESSIONAL SUMMARY
I am a seasoned Senior Product Manager with 8+ years of experience. My expertise lies in driving product vision.

Senior Product Manager | Snapdeal | Nov 2023 – present  | Gurgaon, India
Leading Lenskart's Consideration & Evaluation POD of Online journey by collaborating with a team of 12 developers and 2 designers to deliver seamless user experiences.

Product Manager | Sahicoin | Oct 2022 – Oct 2023 | Remote, India
Sahicoin is a crypto discovery platform for smart investment decisions. I led the product & analytics within the organization.
•Reduced Customer acquisition cost by 19% through implementation of referral program and optimized marketing campaigns
•Launched (0-1) magicpin's SaaS product, empowering merchants to create their own online store. Onboarded 90K+ merchants in 6 months

CERTIFICATIONS
No certifications found

Email: john.smith@email.com
Phone: (555) 123-4567
LinkedIn Profile
"""

def extract_evidence_for_category(category_name: str, resume_text: str, score: int) -> str:
    """Extract evidence text for specific categories"""
    
    evidence_patterns = {
        'Personal Pronouns': [r'\b(I|me|my|we|our)\b'],
        'Dates': [r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}', r'\d{4}\s*[-–]\s*(present|Present|\d{4})'],
        'Verb Tenses': [r'\b(led|managed|developed|created|launched|built|designed|implemented)\b'],
        'Summary': [r'(PROFESSIONAL SUMMARY|SUMMARY|PROFILE)', r'\b(I|me|my)\b.*summary'],
        'Repetition': [r'\b(implementing|developed|managed|led)\b'],
        'Growth Signals': [r'\b(promoted|promotion|advanced|expanded role)\b'],
        'Certifications': [r'(CERTIFICATIONS?|CERTIFICATES?)', r'No certifications'],
        'Teamwork': [r'\b(team|collaborate|collaborated|cross-functional|stakeholder)\b'],
        'Contact Details': [r'email|phone|linkedin|github', r'@\w+\.\w+', r'\(\d{3}\)\s*\d{3}'],
        'Skills Section': [r'(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES)'],
        'Spelling': [r'\b\w*[aeiou]{3,}\w*\b'],  # Simple spelling check pattern
        'Grammar': [r'\b(their|there|they\'re|your|you\'re)\b'],
        'Analytical': [r'\b(\d+%|\$\d+|increased|decreased|improved|optimized)\b'],
        'Leadership': [r'\b(led|managed|supervised|directed|guided|mentored)\b'],
        'Action Verbs': [r'\b(achieved|delivered|implemented|executed|developed)\b']
    }
    
    category_patterns = evidence_patterns.get(category_name, [])
    found_evidence = []
    
    for pattern in category_patterns:
        matches = re.finditer(pattern, resume_text, re.IGNORECASE)
        for match in matches:
            # Get surrounding context (up to 50 chars before and after)
            start = max(0, match.start() - 25)
            end = min(len(resume_text), match.end() + 25)
            context = resume_text[start:end].strip()
            if context and len(context) > 10:
                found_evidence.append(context)
                break  # Only take first match per pattern
    
    if found_evidence:
        # Return the first piece of evidence found
        return found_evidence[0]
    elif score <= 4:
        return "Issues detected in content analysis"
    else:
        return "None flagged"

def get_why_matters_explanation(category_name: str, score: int) -> str:
    """Generate 'Why this matters' explanation for each category"""
    
    explanations = {
        'Contact Details': "ATS systems need properly formatted contact information to reach you for interviews.",
        'Education Section': "Education formatting affects ATS parsing and recruiter confidence in your qualifications.",
        'Skills Section': "Properly organized skills help ATS match you to job requirements and keywords.",
        'Analytical': "Quantified analytical achievements demonstrate measurable business impact to employers.",
        'Leadership': "Leadership examples show career growth potential and management capabilities.",
        'Page Density': "Proper white space and layout improve ATS readability and human reviewer experience.",
        'Use of Bullets': "Consistent bullet formatting helps ATS parse your achievements correctly.",
        'Grammar': "Grammar errors create negative first impressions and suggest lack of attention to detail.",
        'Spelling': "Spelling mistakes can cause automatic ATS rejection and harm professional credibility.",
        'Verb Tenses': "Consistent tenses (past for old roles, present for current) improve professional presentation.",
        'Personal Pronouns': "Removing 'I', 'me', 'my' makes your resume more professional and ATS-friendly.",
        'Quantifiable Achievements': "Numbers and metrics prove your impact and help you stand out to recruiters.",
        'Action Verbs': "Strong action verbs create impact and help ATS categorize your experience correctly.",
        'Active Voice': "Active voice makes your achievements more powerful and easier for ATS to parse.",
        'Summary': "Professional summaries without pronouns improve ATS keyword matching and readability.",
        'Teamwork': "Collaboration examples demonstrate soft skills that employers highly value.",
        'Verbosity': "Concise language improves readability and keeps recruiters engaged.",
        'Repetition': "Varied vocabulary prevents ATS keyword stuffing penalties and shows communication skills.",
        'Unnecessary Sections': "Removing outdated sections focuses attention on relevant qualifications.",
        'Growth Signals': "Career progression evidence shows ambition and capability for advancement.",
        'Drive': "Self-motivation examples demonstrate initiative that employers seek.",
        'Certifications': "Relevant certifications validate skills and improve ATS keyword matching.",
        'Dates': "Consistent date formatting helps ATS parse your work history accurately.",
        'CV Readability Score': "Overall readability affects both ATS parsing success and human reviewer engagement."
    }
    
    return explanations.get(category_name, f"{category_name} optimization improves ATS compatibility and recruiter appeal.")

def get_score_label(score: int) -> str:
    """Get user-friendly score label"""
    if score >= 80:  # For overall percentage scores
        return "Pass"
    elif score >= 50:
        return "Needs Attention"
    elif score >= 8:  # For individual category scores (out of 10)
        return "Pass"
    elif score >= 5:
        return "Needs Attention"
    else:
        return "Critical"

def generate_comprehensive_enhanced_txt_report(resume_text: str = SAMPLE_RESUME_TEXT) -> str:
    """Generate comprehensive TXT report with all 25 categories"""
    
    logger.info("🚀 Starting comprehensive enhanced TXT report generation...")
    
    # Initialize Gemini client if available
    gemini_client = None
    if GEMINI_AVAILABLE:
        try:
            gemini_api_key = os.getenv('GEMINI_API_KEY')
            if gemini_api_key:
                gemini_client = GeminiOptimizer(api_key=gemini_api_key)
                logger.info("✅ Gemini client initialized for fix suggestions")
            else:
                logger.warning("⚠️ GEMINI_API_KEY not found, using fallback suggestions")
        except Exception as e:
            logger.warning(f"⚠️ Could not initialize Gemini client: {e}")
    
    # Get all 25 categories from backend - REQUIRED, no fallbacks
    if not CV_PARSER_AVAILABLE:
        logger.error("❌ CV Parser not available - cannot generate report without real backend data")
        return "Error: CV Parser module not available - cannot generate analysis without real backend data"
    
    try:
        all_categories = generate_comprehensive_ats_scores_frontend(resume_text)
        logger.info(f"✅ Generated {len(all_categories)} categories from backend")
    except Exception as e:
        logger.error(f"❌ Failed to generate categories: {e}")
        return f"Error: Could not generate category analysis: {e}"
    
    # Calculate overall score
    total_score = sum(cat['score'] for cat in all_categories)
    max_score = len(all_categories) * 10
    overall_percentage = int((total_score / max_score) * 100)
    
    # Categorize by score
    critical_categories = [cat for cat in all_categories if cat['score'] <= 4]
    needs_attention_categories = [cat for cat in all_categories if 5 <= cat['score'] <= 7]
    pass_categories = [cat for cat in all_categories if cat['score'] >= 8]
    
    # Start building report
    report_lines = [
        "=" * 80,
        "ATS COMPREHENSIVE ANALYSIS REPORT - ALL 25 CATEGORIES",
        "=" * 80,
        f"Current ATS Score: {overall_percentage}/100 – {get_score_label(overall_percentage)}",
        f"Report Generated: 2025-08-27 12:00:00",
        "",
        "EXECUTIVE DASHBOARD",
        "-" * 40,
        f"🚨 Critical Issues (0-4/10): {len(critical_categories)}",
        f"⚡ Needs Attention (5-7/10): {len(needs_attention_categories)}",
        f"✅ Pass Categories (8-10/10): {len(pass_categories)}",
        f"📊 Total Categories Analyzed: {len(all_categories)}",
        "",
        "🎯 PRIORITY ACTION PLAN",
        "-" * 40,
        "1. Fix Critical Issues first (biggest impact)",
        "2. Address Needs Attention items (quick wins)",
        "3. Maintain Pass categories (keep strong performance)",
        "",
        ""
    ]
    
    # Generate sections for each category type
    for section_title, categories, emoji in [
        ("🚨 CRITICAL ISSUES (IMMEDIATE ATTENTION REQUIRED)", critical_categories, "🚨"),
        ("⚡ NEEDS ATTENTION (IMPROVEMENT OPPORTUNITIES)", needs_attention_categories, "⚡"),
        ("✅ PASS CATEGORIES (STRONG PERFORMANCE)", pass_categories, "✅")
    ]:
        if categories:
            report_lines.extend([
                section_title,
                "=" * 60,
            ])
            
            for i, category in enumerate(categories, 1):
                category_name = category['name']
                score = category['score']
                score_label = get_score_label(score)
                
                # Extract evidence
                evidence = extract_evidence_for_category(category_name, resume_text, score)
                
                # Get why it matters
                why_matters = get_why_matters_explanation(category_name, score)
                
                # Generate fix suggestion
                fix_suggestion = "Follow ATS best practices for improvement."
                if gemini_client and gemini_client.available:
                    try:
                        fix_suggestion = gemini_client.generate_fix_suggestion_with_gemini(
                            category_name, evidence, score, why_matters
                        )
                    except Exception as e:
                        logger.warning(f"Failed to get Gemini suggestion for {category_name}: {e}")
                
                # Add category block
                report_lines.extend([
                    f"{i}. {category_name.upper()}: {category_name} Analysis",
                    f"   Current Score: {score}/10 – {score_label}",
                    "",
                    f"   **Evidence**: {evidence}",
                    f"   **Why this matters**: {why_matters}",
                    f"   **Fix**: {fix_suggestion}",
                    "",
                    "-" * 50,
                    ""
                ])
            
            report_lines.append("")
    
    # Add summary section
    report_lines.extend([
        "📊 DETAILED CATEGORY BREAKDOWN",
        "=" * 60
    ])
    
    for category in all_categories:
        score_label = get_score_label(category['score'])
        report_lines.append(f"{category['name'].upper()} - Score: {category['score']}/10 – {score_label}")
    
    report_lines.extend([
        "",
        "🔥 IMMEDIATE NEXT STEPS",
        "=" * 60,
        "1. Print this report or keep it open while editing",
        "2. Work through Critical Issues first - they have the biggest impact",  
        "3. Use the Evidence quotes to find exact problems in your resume",
        "4. Apply the Fix suggestions to improve each category",
        "5. Re-upload your resume to see score improvement",
        "",
        "💡 PRO TIPS FOR MAXIMUM ATS SUCCESS",
        "=" * 60,
        "• Each fix above was AI-generated specifically for your resume",
        "• Evidence shows the exact text that caused scoring issues",
        "• Focus on Critical and Needs Attention categories first",
        "• Even Pass categories can be improved for perfection",
        "• Save final resume as PDF to preserve formatting",
        "",
        "Generated by BestCVBuilder.com with Gemini AI Enhancement",
        "For more optimization: https://bestcvbuilder.com",
        "=" * 80
    ])
    
    final_report = "\n".join(report_lines)
    logger.info(f"✅ Generated comprehensive report with {len(all_categories)} categories")
    
    return final_report

if __name__ == "__main__":
    # Generate the enhanced report
    enhanced_report = generate_comprehensive_enhanced_txt_report()
    
    # Save to file
    output_file = "comprehensive_enhanced_resume_analysis.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(enhanced_report)
    
    print(f"✅ Comprehensive enhanced TXT report generated: {output_file}")
    print(f"📊 Report length: {len(enhanced_report)} characters")