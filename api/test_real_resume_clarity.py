#!/usr/bin/env python3
"""
Test enhanced TXT report with the actual problematic resume data
that was generating unclear explanations
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'cv-parser'))

def test_real_resume_clarity():
    """Test enhanced TXT report with real problematic resume from the user's report"""
    
    print("🔍 Testing Enhanced TXT Report with REAL PROBLEMATIC RESUME")
    print("=" * 70)
    
    # Use the EXACT resume content that was generating unclear explanations
    # This is reconstructed from the patterns in your original report
    problematic_resume = """Deepak Yadav
Senior Product Manager
yadavdeepak287@gmail.com
LinkedIn Profile
linkedin.com/in/deepak-yadav-product | +91-9899123456 | Gurgaon, India

Profile Summary

Results-driven Product Manager with 5+ years of hands-on experience leading high-impact B2C & B2B digital products and innovative solutions across fintech, e-commerce, and edtech domains.

WORK EXPERIENCE

Senior Product Manager, Lenskart.com
Leading Lenskart's Consideration & Evaluation POD of Online journey by collaborating with a team of 12 developers and 2 designers to deliver seamless user experiences.
•Launched (0-1) magicpin's SaaS product, empowering merchants to create their own online store. Onboarded 90K+ merchants in 6 months
•Increased New user GOLD attachment by 12% by implementing "Buy 1 Get 1 Free Later" offering with GOLD membership
•Reduced fit-related returns by 29% and increased size adoption to 43% by introducing frame size and user fit feature

Product Manager, Sahicoin
Nov 2023 – present  | Gurgaon, India
Sahicoin is a crypto discovery platform for smart investment decisions. I led the product & analytics within the organization.
•Launched Trueone.ai (0-1), a members-only crypto investment platform enabling users to follow real-time expert strategies
while retaining asset custody; scaled to $500K+ AUM and $9M+ in monthly trading volume.
•Increased Daily Active Users by 23% and increased user retention by 37% through feature development and A/B testing

Product Manager, BYJU'S
Worked in Merchant Product (B2B) team in order to increase merchant acquisition and engagement.
•Increased Student engagement by implementing Gamification engine resulting in improved completion rate by 18%
•Increased Revenue by 23% by implementing premium subscriptions and introducing in-app purchase features

EDUCATION
B.Tech Computer Science
Motilal Nehru National Institute Of Technology
Jul 2015 – May 2019  | Varanasi, India

CERTIFICATIONS
No certifications found"""
    
    # Mock analysis matching the scores in the problematic report
    mock_analysis = {
        'comprehensive_final_score': 64.45833333333333,
        'content': problematic_resume,
        'detailedAnalysis': {
            'verb_tenses': {
                'score': 4,
                'issues': ['Use consistent and appropriate verb tenses']
            },
            'summary': {
                'score': 3,
                'issues': ['Rewrite entire summary removing all personal pronouns']
            },
            'repetition': {
                'score': 0,
                'issues': ['Completely rewrite repetitive phrases with varied vocabulary']
            },
            'dates': {
                'score': 0,
                'issues': ['Add missing employment and education dates immediately']
            },
            'growth_signals': {
                'score': 0,
                'issues': ['Highlight any promotion or role expansion you have had']
            },
            'certifications': {
                'score': 4,
                'issues': ['Obtain fundamental industry certifications immediately']
            },
            'personal_pronouns': {
                'score': 7,
                'issues': ['Remove first-person pronouns like "I", "me", "my"']
            },
            'teamwork': {
                'score': 5,
                'issues': ['Better showcase collaborative experiences']
            },
            'analytical': {
                'score': 5,
                'issues': ['Quantify analytical impact with percentages and metrics']
            },
            'drive': {
                'score': 5,
                'issues': ['Show initiative and self-motivation examples']
            },
            'unnecessary_sections': {
                'score': 6,
                'issues': ['Remove outdated sections']
            }
        }
    }
    
    try:
        from index import generate_comprehensive_issues_report
        
        print("📊 Generating enhanced TXT report with REAL problematic resume...")
        enhanced_report = generate_comprehensive_issues_report(mock_analysis)
        
        print(f"✅ Enhanced report generated!")
        print(f"📄 Report length: {len(enhanced_report)} characters")
        
        # Save the report for manual inspection
        with open('/Users/jatinbhagat/projects/bestcvbuilder/api/real_resume_clarity_test.txt', 'w') as f:
            f.write(enhanced_report)
        print(f"💾 Enhanced report saved as 'real_resume_clarity_test.txt'")
        
        # Analyze specific clarity improvements for the problematic categories
        print(f"\n🎯 **CLARITY ANALYSIS FOR PROBLEMATIC CATEGORIES:**")
        
        # Check if verb tenses now has clear explanations
        if 'ATS Rule: Use past tense for previous roles' in enhanced_report:
            print("✅ VERB TENSES: Now explains which tense to use and why")
        else:
            print("❌ VERB TENSES: Still unclear")
            
        # Check if summary shows actual analysis
        if 'Summary analysis:' in enhanced_report and 'words,' in enhanced_report:
            print("✅ SUMMARY: Now shows word count, pronouns, and specific analysis")
        else:
            print("❌ SUMMARY: Still unclear")
            
        # Check if repetition shows frequency analysis
        if 'repetition detected:' in enhanced_report.lower() and '{' in enhanced_report:
            print("✅ REPETITION: Now shows specific repeated words with counts")
        else:
            print("❌ REPETITION: Still unclear")
            
        # Check if dates shows format analysis
        if 'different formats:' in enhanced_report:
            print("✅ DATES: Now shows specific format inconsistencies found")
        else:
            print("❌ DATES: Still unclear")
            
        # Check for penalty breakdowns
        penalty_count = enhanced_report.count('Penalties Applied:')
        print(f"✅ PENALTY BREAKDOWNS: Found {penalty_count} detailed penalty explanations")
        
        # Check for scoring rule explanations
        ats_rule_count = enhanced_report.count('ATS Rule:')
        print(f"✅ ATS RULES: Found {ats_rule_count} specific ATS rule explanations")
        
        print(f"\n📈 **OVERALL CLARITY ASSESSMENT:**")
        if penalty_count >= 6 and ats_rule_count >= 6:
            print("🎉 **EXCELLENT**: All categories now have clear explanations!")
            return True
        elif penalty_count >= 4 and ats_rule_count >= 4:
            print("✅ **GOOD**: Most categories have clear explanations")
            return True
        else:
            print("⚠️ **NEEDS MORE WORK**: Many categories still lack clarity")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_real_resume_clarity()
    print(f"\n🎯 **FINAL CLARITY TEST: {'✅ PASS - Categories now have clear explanations!' if success else '❌ FAIL - More clarity work needed'}**")