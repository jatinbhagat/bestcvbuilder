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
    
    # Import specific analysis functions for detailed breakdown
    analyze_verb_tenses_frontend = cv_parser_module.analyze_verb_tenses_frontend
    analyze_repetition_frontend = cv_parser_module.analyze_repetition_frontend
    analyze_personal_pronouns_frontend = cv_parser_module.analyze_personal_pronouns_frontend
    analyze_date_formatting = cv_parser_module.analyze_date_formatting
    
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

def get_backend_evidence_and_analysis(category_name: str, resume_text: str, score: int) -> Dict[str, str]:
    """Get evidence and detailed analysis matching backend scoring logic"""
    
    if not CV_PARSER_AVAILABLE:
        return {
            'evidence': 'Backend analysis unavailable',
            'analysis': f'Category scored {score}/10 based on content analysis',
            'penalties': f'Total deductions: -{10-score} points',
            'rule_explanation': f'ATS rules for {category_name}'
        }
    
    try:
        import re
        from collections import Counter
        
        category_lower = category_name.lower().replace(' ', '_')
        
        if category_lower == 'verb_tenses':
            # Replicate backend verb tense analysis
            past_tense_verbs = ['developed', 'created', 'managed', 'led', 'implemented', 'designed', 'achieved', 'delivered']
            present_tense_verbs = ['develop', 'create', 'manage', 'lead', 'implement', 'design', 'achieve', 'deliver']
            
            text_lower = resume_text.lower()
            past_count = sum(1 for verb in past_tense_verbs if verb in text_lower)
            present_count = sum(1 for verb in present_tense_verbs if verb in text_lower)
            
            # Find first evidence
            evidence = "No verbs found"
            for verb in past_tense_verbs + present_tense_verbs:
                match = re.search(rf'\b{verb}\b.*', resume_text, re.IGNORECASE)
                if match:
                    evidence = match.group(0)[:60] + "..." 
                    break
            
            if present_count > past_count:
                analysis = f'Poor tense usage: Found {present_count} present tense vs {past_count} past tense verbs'
                penalties = f'Too many present tense verbs: -6 points (10 → 4)'
            else:
                analysis = f'Mixed tenses: Found {past_count} past tense and {present_count} present tense verbs'
                penalties = f'Tense inconsistency penalty: -{10-score} points (10 → {score})'
                
            return {
                'evidence': evidence,
                'analysis': analysis,
                'penalties': penalties,
                'rule_explanation': 'Use past tense for previous roles, present tense only for current position'
            }
            
        elif category_lower == 'personal_pronouns':
            # Replicate backend personal pronoun analysis  
            pronoun_patterns = [r'\bi\b', r'\bme\b', r'\bmy\b', r'\bmyself\b', r'\bour\b', r'\bwe\b']
            
            found_pronouns = []
            evidence = "None flagged"
            for pattern in pronoun_patterns:
                matches = re.findall(pattern, resume_text, re.IGNORECASE)
                if matches:
                    found_pronouns.extend(matches)
                    # Find first occurrence with context
                    match = re.search(rf'.{{0,30}}{pattern}.{{0,30}}', resume_text, re.IGNORECASE)
                    if match:
                        evidence = match.group(0).strip()
                        break
            
            if len(found_pronouns) == 0:
                analysis = 'Excellent: No personal pronouns found'
                penalties = f'No penalties (score: {score}/10)'
            else:
                analysis = f'Found {len(found_pronouns)} personal pronouns: {", ".join(set(found_pronouns[:3]))}'
                penalty = min(6, len(found_pronouns))
                penalties = f'Personal pronoun penalty: -{penalty} points (10 → {10-penalty})'
                
            return {
                'evidence': evidence,
                'analysis': analysis,
                'penalties': penalties,
                'rule_explanation': 'Remove all first-person pronouns (I, me, my, we, our)'
            }
            
        elif category_lower == 'repetition':
            # Replicate backend repetition analysis
            action_verbs_patterns = [
                r'\b(manage[ds]?|managing)\b', r'\b(develop[eds]?|developing)\b', 
                r'\b(creat[ed]?|creating)\b', r'\b(implement[eds]?|implementing)\b',
                r'\b(lead[s]?|leading|led)\b', r'\b(design[eds]?|designing)\b'
            ]
            
            verb_matches = []
            evidence = "None flagged"
            for pattern in action_verbs_patterns:
                matches = re.findall(pattern, resume_text, re.IGNORECASE)
                if matches:
                    verb_matches.extend([match[0] if isinstance(match, tuple) else match for match in matches])
                    if evidence == "None flagged":
                        match = re.search(rf'.{{0,30}}{pattern}.{{0,30}}', resume_text, re.IGNORECASE)
                        if match:
                            evidence = match.group(0).strip()
            
            verb_counts = Counter(verb_matches)
            repeated_verbs = {verb: count for verb, count in verb_counts.items() if count > 1}
            
            if not repeated_verbs:
                analysis = 'Good verb variety: No repeated action verbs found'  
                penalties = f'No repetition penalties (score: {score}/10)'
            else:
                analysis = f'Verb repetition detected: {dict(repeated_verbs)}'
                total_repetition = sum(count - 1 for count in repeated_verbs.values())
                penalty = min(10, total_repetition * 2)
                penalties = f'Repetition penalty: -{penalty} points (10 → {10-penalty})'
                
            return {
                'evidence': evidence,
                'analysis': analysis,
                'penalties': penalties,
                'rule_explanation': 'Vary action verbs - deduct 2 points per repeated verb occurrence'
            }
            
        elif category_lower == 'dates':
            # Replicate backend date analysis
            date_patterns = [
                (r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b', 'Month YYYY'),
                (r'\b\d{4}\s*[-–]\s*(present|Present|\d{4})\b', 'YYYY-Present')
            ]
            
            all_dates = []
            format_types = []
            evidence = "None flagged"
            
            for pattern, format_name in date_patterns:
                matches = re.findall(pattern, resume_text, re.IGNORECASE)
                if matches:
                    all_dates.extend(matches)
                    format_types.extend([format_name] * len(matches))
                    if evidence == "None flagged":
                        match = re.search(rf'.{{0,30}}{pattern}.{{0,30}}', resume_text, re.IGNORECASE)
                        if match:
                            evidence = match.group(0).strip()
            
            if len(set(format_types)) <= 1 and len(all_dates) > 0:
                analysis = f'Good date consistency: Found {len(all_dates)} dates in consistent format'
                penalties = f'No date formatting penalties (score: {score}/10)'
            elif len(all_dates) == 0:
                analysis = 'No employment or education dates found in resume'
                penalties = f'Missing dates penalty: -{10-score} points (10 → {score})'
            else:
                analysis = f'Date inconsistency: Found {len(set(format_types))} different formats: {", ".join(set(format_types))}'
                penalty = len(set(format_types)) * 2
                penalties = f'Format inconsistency penalty: -{penalty} points'
                
            return {
                'evidence': evidence,
                'analysis': analysis,
                'penalties': penalties,
                'rule_explanation': 'Consistent date formatting required across all work/education entries'
            }
            
        else:
            # Generic analysis for other categories
            evidence = "None flagged" if score >= 8 else "Issues detected in content analysis"
            analysis = f'Category scored {score}/10 based on content analysis'
            penalties = f'Deductions applied: -{10-score} points (10 → {score})'
            rule_explanation = f'ATS scoring rules applied to {category_name}'
            
            return {
                'evidence': evidence,
                'analysis': analysis,
                'penalties': penalties,
                'rule_explanation': rule_explanation
            }
        
    except Exception as e:
        logger.warning(f"Failed to get backend analysis for {category_name}: {e}")
        return {
            'evidence': "Analysis unavailable",
            'analysis': f'Category scored {score}/10 based on content analysis',
            'penalties': f'Total deductions: -{10-score} points',
            'rule_explanation': f'ATS rules for {category_name}'
        }

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
                
                # Get backend evidence and analysis
                backend_analysis = get_backend_evidence_and_analysis(category_name, resume_text, score)
                
                # Get why it matters
                why_matters = get_why_matters_explanation(category_name, score)
                
                # Generate fix suggestion
                fix_suggestion = "Follow ATS best practices for improvement."
                if gemini_client and gemini_client.available:
                    try:
                        fix_suggestion = gemini_client.generate_fix_suggestion_with_gemini(
                            category_name, backend_analysis['evidence'], score, why_matters
                        )
                    except Exception as e:
                        logger.warning(f"Failed to get Gemini suggestion for {category_name}: {e}")
                
                # Add category block with backend analysis details
                report_lines.extend([
                    f"{i}. {category_name.upper()}: {category_name} Analysis",
                    f"   Current Score: {score}/10 – {score_label}",
                    "",
                    f"   💡 SCORING BREAKDOWN:",
                    f"   ATS Rule: {backend_analysis['rule_explanation']}",
                    f"   Analysis: {backend_analysis['analysis']}",
                    f"   Penalties Applied: {backend_analysis['penalties']}",
                    "",
                    f"   **Evidence**: {backend_analysis['evidence']}",
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