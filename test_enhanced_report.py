#!/usr/bin/env python3
"""
Test the enhanced TXT report generation with sample resume data
"""

import sys
import os

# Add the API directory to Python path
sys.path.append('api/cv-parser')

# Import the enhanced report functions
from index import extract_specific_issues_with_examples, generate_comprehensive_issues_report

def test_enhanced_report():
    """Test the enhanced report with sample resume data"""
    
    # Sample analysis result with resume content that will trigger our regex patterns
    sample_analysis = {
        'ats_score': 64.45,
        'content': """John Smith
Software Engineer
john.smith@email.com
Phone: 555-123-4567

Experience:
Software Engineer                                    01/2020-12/2022
- Managed a team of 5 people
- Managed software development projects from start to finish
- Managed client relationships and managed project timelines
- Handled customer support issues

Software Developer                                   2018-2020
- Developed web applications
- Responsible for code review

Education:
University of Technology                             2019
Bachelor of Science in Computer Science

Skills:
Python, Java, JavaScript, React
""",
        'detailedAnalysis': {
            'dates': {'score': 2, 'issues': ['Missing consistent date format']},
            'action_verbs': {'score': 3, 'issues': ['Repetitive verbs - managed used 3 times']},
            'contact_info': {'score': 5, 'issues': ['Missing LinkedIn profile']},
            'quantifiable_achievements': {'score': 4, 'issues': ['Missing metrics and numbers']}
        }
    }
    
    print("🧪 Testing Enhanced TXT Report Generation...")
    print("=" * 60)
    
    try:
        # Test the specific issues extraction
        print("1. Testing specific issues extraction...")
        specific_issues = extract_specific_issues_with_examples(sample_analysis)
        
        print(f"   Critical Issues: {len(specific_issues.get('critical_issues', []))}")
        print(f"   Quick Wins: {len(specific_issues.get('quick_wins', []))}")
        print(f"   Content Improvements: {len(specific_issues.get('content_improvements', []))}")
        
        # Debug: Show what was found in the first critical issue
        if specific_issues.get('critical_issues'):
            issue = specific_issues['critical_issues'][0]
            print(f"   Debug - First Critical Issue:")
            print(f"     Title: {issue.get('title', 'N/A')}")
            print(f"     Problematic Text: '{issue.get('problematic_text', 'N/A')}'")
            print(f"     Line Number: {issue.get('line_number', 'N/A')}")
            print(f"     Fix Suggestion: {issue.get('fix_suggestion', 'N/A')}")
        
        # Test the comprehensive report generation
        print("\n2. Testing comprehensive report generation...")
        report = generate_comprehensive_issues_report(sample_analysis)
        
        # Check if the report contains the expected new elements
        expected_elements = [
            "ATS SPECIFIC ISSUES REPORT WITH RESUME EXAMPLES",
            "EXECUTIVE DASHBOARD",
            "📍 FOUND IN YOUR RESUME",
            "✅ SPECIFIC FIX:",
            "🎯 YOUR SPECIFIC ACTION CHECKLIST",
            "Estimated Fix Time"
        ]
        
        found_elements = []
        for element in expected_elements:
            if element in report:
                found_elements.append(element)
                print(f"   ✅ Found: {element}")
            else:
                print(f"   ❌ Missing: {element}")
        
        print(f"\n3. Report Quality Check:")
        print(f"   Report Length: {len(report)} characters")
        print(f"   Lines Generated: {len(report.split('\\n'))}")
        print(f"   Elements Found: {len(found_elements)}/{len(expected_elements)}")
        
        # Save a sample report for manual review
        print("\n4. Saving sample report...")
        with open('/Users/jatinbhagat/Downloads/Enhanced_ATS_Report_Sample.txt', 'w') as f:
            f.write(report)
        print("   Sample report saved to Downloads folder")
        
        # Print first part of report for preview
        print("\n5. Report Preview (first 1000 characters):")
        print("-" * 60)
        print(report[:1000] + "..." if len(report) > 1000 else report)
        
        if len(found_elements) >= 4:
            print("\n🎉 SUCCESS: Enhanced report generation is working!")
            return True
        else:
            print("\n❌ FAILURE: Enhanced report missing key elements")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_enhanced_report()
    sys.exit(0 if success else 1)