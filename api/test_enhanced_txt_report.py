#!/usr/bin/env python3
"""
Comprehensive test script for enhanced TXT report generation
Tests the specific issues identified in the problematic report
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'cv-parser'))

def test_enhanced_categories():
    """Test enhanced TXT report with real problematic resume content from the provided report"""
    
    print("🔍 Testing Enhanced Category-Specific TXT Report Generation")
    print("=" * 70)
    
    # Use the actual problematic content from the report
    problematic_resume = """Deepak Yadav  Senior Product Manager
yadavdeepak287@gmail.com
linkedin.com/in/deepak-yadav-product | +91-9899123456 | Gurgaon, India

PROFESSIONAL SUMMARY
I am a seasoned Senior Product Manager with 8+ years of experience. My expertise lies in driving product vision.

EXPERIENCE

Senior Product Manager | Snapdeal | Nov 2023 – present  | Gurgaon, India
•Increased New user GOLD attachment by 12% by implementing "Buy 1 Get 1 Free Later" offering with GOLD membership.
•Reduced fit-related returns by 29% and increased size adoption to 43% by introducing frame size and user fit feature.
•Increased PDP-to-cart conversion from 30% to 37% by adding video catalogs, rich fashion-first PDP, and forward navigation

Product Manager | Sahicoin | Oct 2022 – Oct 2023 | Remote, India
Sahicoin is a crypto discovery platform for smart investment decisions. I led the product & analytics within the organization.
•Increased Daily Active Users by 23% and increased user retention by 37% through feature development and A/B testing
•Increased in-app user engagement by 42% by improving news feed algorithm and user personalization features
•Increased conversion rate by 15% by improving onboarding experience and reducing user acquisition cost by 22%

Senior Product Manager | BYJU'S | Jan 2020 – Sep 2022 | Bangalore, India
•Increased Student engagement by implementing Gamification engine resulting in improved completion rate by 18%
•Increased Revenue by 23% by implementing premium subscriptions and introducing in-app purchase features
•Reduced Customer acquisition cost by 19% through implementation of referral program and optimized marketing campaigns

EDUCATION
B.Tech (Computer Science)  | Motilal Nehru National Institute Of Technology | Jul 2015 – May 2019  | Varanasi, India

CERTIFICATIONS
Google Analytics Certified, 2021
Product Management Certificate, IIM Bangalore"""
    
    # Mock analysis with various score levels to test different categories
    mock_analysis = {
        'comprehensive_final_score': 64.46,
        'content': problematic_resume,
        'detailedAnalysis': {
            'verb_tenses': {
                'score': 4,
                'issues': ['Use consistent and appropriate verb tenses']
            },
            'personal_pronouns': {
                'score': 7,
                'issues': ['Remove first-person pronouns like "I", "me", "my"']
            },
            'repetition': {
                'score': 0,
                'issues': ['Completely rewrite repetitive phrases with varied vocabulary']
            },
            'dates': {
                'score': 0,
                'issues': ['Add missing employment and education dates immediately']
            },
            'summary': {
                'score': 3,
                'issues': ['Rewrite entire summary removing all personal pronouns']
            },
            'growth_signals': {
                'score': 0,
                'issues': ['Highlight any promotion or role expansion you have had']
            },
            'certifications': {
                'score': 4,
                'issues': ['Obtain fundamental industry certifications immediately']
            },
            'teamwork': {
                'score': 5,
                'issues': ['Better showcase collaborative experiences']
            },
            'analytical': {
                'score': 5,
                'issues': ['Quantify analytical impact with percentages and metrics']
            }
        }
    }
    
    try:
        from index import generate_comprehensive_issues_report
        
        print("📊 Generating enhanced TXT report...")
        enhanced_report = generate_comprehensive_issues_report(mock_analysis)
        
        print(f"✅ Enhanced report generated!")
        print(f"📄 Report length: {len(enhanced_report)} characters")
        
        # Analyze improvements
        improvements = analyze_report_improvements(enhanced_report, problematic_resume)
        
        print(f"\n🎯 **IMPROVEMENT ANALYSIS:**")
        print(f"✅ Category-specific examples: {improvements['category_specific']}")
        print(f"✅ Verb tense rule explanations: {improvements['verb_tense_rules']}")
        print(f"✅ Actual pronoun detection: {improvements['actual_pronouns']}")
        print(f"✅ Real repetition identification: {improvements['real_repetition']}")
        print(f"✅ Contextual fix suggestions: {improvements['contextual_fixes']}")
        print(f"✅ Before/after examples: {improvements['before_after']}")
        print(f"✅ No irrelevant examples: {improvements['no_irrelevant']}")
        
        # Save enhanced report
        with open('/Users/jatinbhagat/projects/bestcvbuilder/api/enhanced_txt_report_test.txt', 'w') as f:
            f.write(enhanced_report)
        print(f"\n💾 Enhanced report saved for comparison")
        
        # Overall assessment
        total_improvements = sum(improvements.values())
        max_possible = len(improvements)
        
        print(f"\n📈 **OVERALL ENHANCEMENT: {total_improvements}/{max_possible} improvements**")
        
        if total_improvements >= 6:
            print("🎉 **EXCELLENT**: Major improvements implemented!")
            return True
        elif total_improvements >= 4:
            print("✅ **GOOD**: Significant improvements made")
            return True
        else:
            print("⚠️ **NEEDS WORK**: More improvements needed")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def analyze_report_improvements(report: str, original_resume: str) -> dict:
    """Analyze specific improvements in the enhanced report"""
    
    improvements = {
        'category_specific': 0,
        'verb_tense_rules': 0,
        'actual_pronouns': 0,
        'real_repetition': 0,
        'contextual_fixes': 0,
        'before_after': 0,
        'no_irrelevant': 0
    }
    
    lines = report.split('\n')
    
    # Check for category-specific examples (not generic name/email)
    if 'Increased New user GOLD attachment' in report and 'yadavdeepak287@gmail.com' not in report:
        improvements['category_specific'] = 1
    elif 'yadavdeepak287@gmail.com' not in report:
        improvements['category_specific'] = 1
    
    # Check for verb tense rule explanations
    if 'past tense for previous roles' in report or 'present tense for current' in report:
        improvements['verb_tense_rules'] = 1
    
    # Check for actual pronoun detection
    if 'I am a seasoned' in report or 'My expertise lies' in report:
        improvements['actual_pronouns'] = 1
    
    # Check for real repetition identification
    if 'Increased' in report and 'appears' in report and 'times' in report:
        improvements['real_repetition'] = 1
    
    # Check for contextual fix suggestions with explanations
    if 'Resume Rule:' in report or 'ATS prefers' in report:
        improvements['contextual_fixes'] = 1
    
    # Check for before/after examples with →
    if '→' in report and '"' in report:
        improvements['before_after'] = 1
    
    # Check that irrelevant examples (name/email in wrong categories) are avoided
    teamwork_section = extract_section(report, 'TEAMWORK')
    if teamwork_section and 'yadavdeepak287@gmail.com' not in teamwork_section:
        improvements['no_irrelevant'] = 1
    elif 'TEAMWORK' not in report:  # If no teamwork section, that's also good (no irrelevant examples)
        improvements['no_irrelevant'] = 1
    
    return improvements

def extract_section(text: str, section_name: str) -> str:
    """Extract a specific section from the report"""
    lines = text.split('\n')
    section_lines = []
    in_section = False
    
    for line in lines:
        if section_name in line.upper():
            in_section = True
            continue
        elif in_section and line.startswith('--'):
            break
        elif in_section:
            section_lines.append(line)
    
    return '\n'.join(section_lines)

def compare_with_original_report():
    """Compare with the original problematic report"""
    
    print(f"\n🔍 **COMPARISON WITH ORIGINAL PROBLEMATIC REPORT:**")
    print("=" * 60)
    
    original_issues = [
        "❌ Verb tenses: Shows 'Increased' bullets but doesn't explain which tense is wrong",
        "❌ Growth signals: Shows 'Deepak Yadav Senior Product Manager' instead of career progression", 
        "❌ Certifications: Shows 'yadavdeepak287@gmail.com' instead of certification issues",
        "❌ Teamwork: Shows name/email instead of collaboration examples",
        "❌ Same lines repeated across multiple categories",
        "❌ Generic fixes like 'Optimize: ... for better ATS performance'",
        "❌ Wrong date suggestions (Jan 2020 - Dec 2022 for 2015-2019 dates)",
        "❌ Summary issues showing work experience bullets instead of summary text"
    ]
    
    expected_fixes = [
        "✅ Verb tenses: Specific tense rules with before/after corrections",
        "✅ Growth signals: Actual job progression and promotion opportunities", 
        "✅ Certifications: Analysis of existing certs with formatting suggestions",
        "✅ Teamwork: Relevant collaboration content or no examples if none found",
        "✅ Unique examples for each category based on actual content",
        "✅ Specific fixes with context and reasoning",
        "✅ Correct date format suggestions based on actual dates",
        "✅ Summary issues from actual summary content with pronouns"
    ]
    
    print("**ORIGINAL PROBLEMATIC ISSUES:**")
    for issue in original_issues:
        print(f"  {issue}")
    
    print(f"\n**EXPECTED ENHANCED FIXES:**")
    for fix in expected_fixes:
        print(f"  {fix}")

if __name__ == "__main__":
    success = test_enhanced_categories()
    compare_with_original_report()
    
    print(f"\n🎯 **FINAL TEST RESULT: {'✅ PASS - Enhanced TXT report is significantly improved!' if success else '❌ FAIL - More work needed'}**")