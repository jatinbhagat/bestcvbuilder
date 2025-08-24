#!/usr/bin/env python3
"""
Test script to verify TXT report generation includes actual CV content
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'cv-parser'))

def test_enhanced_txt_report():
    """Test that TXT report includes real CV content"""
    
    print("🔍 Testing Enhanced TXT Report Generation...")
    print("=" * 60)
    
    # Sample resume content for testing
    sample_cv_content = """John Smith
Email: john.smith@email.com
Phone: (555) 123-4567

PROFESSIONAL SUMMARY
I am a software engineer with 5+ years of experience. My background includes full-stack development.

EXPERIENCE
Software Engineer | TechCorp | 2020-2023
• I developed web applications
• I managed the database systems
• I improved system performance by 30%

Junior Developer | StartupXYZ | 2018-2020  
• Developed web features
• Developed mobile apps
• Fixed bugs and issues

EDUCATION
Bachelor of Science in Computer Science | University | 2018

SKILLS  
Python, JavaScript, React
"""
    
    # Create mock analysis result
    mock_analysis = {
        'comprehensive_final_score': 64.5,
        'content': sample_cv_content,
        'detailedAnalysis': {
            'personal_pronouns': {
                'score': 3,
                'issues': ['Remove first-person pronouns like "I", "me", "my"']
            },
            'repetition': {
                'score': 2,
                'issues': ['Completely rewrite repetitive phrases with varied vocabulary']
            },
            'dates': {
                'score': 6,
                'issues': ['Use consistent date format']
            },
            'contact_details': {
                'score': 8,
                'issues': ['Add LinkedIn profile URL']
            },
            'skills_section': {
                'score': 7,
                'issues': ['Add specific software proficiency levels']
            }
        }
    }
    
    try:
        from index import generate_comprehensive_issues_report
        
        print("📄 Generating TXT report with enhanced CV examples...")
        report = generate_comprehensive_issues_report(mock_analysis)
        
        print(f"✅ Report generated successfully!")
        print(f"📊 Report length: {len(report)} characters")
        
        # Check if report contains actual CV content
        cv_content_found = False
        example_lines_found = []
        
        lines = report.split('\n')
        for line in lines:
            if 'FOUND IN YOUR RESUME' in line:
                cv_content_found = True
            if line.strip().startswith('"') and 'john.smith' in line.lower() or 'software engineer' in line.lower():
                example_lines_found.append(line.strip())
        
        print(f"\n🔍 Analysis Results:")
        print(f"   CV content examples found: {'✅ YES' if cv_content_found else '❌ NO'}")
        print(f"   Number of CV examples: {len(example_lines_found)}")
        
        if example_lines_found:
            print(f"\n📝 Sample CV Examples Found:")
            for i, example in enumerate(example_lines_found[:3], 1):
                print(f"   {i}. {example}")
        
        # Check for specific improvements
        has_line_numbers = 'Line ' in report
        has_fix_suggestions = 'EXAMPLE REPLACEMENT' in report or '→' in report
        has_specific_issues = 'Personal pronouns detected' in report or 'Repeated verb' in report
        
        print(f"\n🎯 Report Quality Check:")
        print(f"   Line numbers included: {'✅ YES' if has_line_numbers else '❌ NO'}")
        print(f"   Fix suggestions included: {'✅ YES' if has_fix_suggestions else '❌ NO'}")
        print(f"   Specific issue detection: {'✅ YES' if has_specific_issues else '❌ NO'}")
        
        # Save sample report for inspection
        with open('/Users/jatinbhagat/projects/bestcvbuilder/api/sample_enhanced_report.txt', 'w') as f:
            f.write(report)
        print(f"\n💾 Sample report saved to: sample_enhanced_report.txt")
        
        # Overall assessment
        improvements_made = sum([cv_content_found, has_line_numbers, has_fix_suggestions, has_specific_issues])
        
        print(f"\n🎯 Overall Assessment: {improvements_made}/4 improvements implemented")
        
        if improvements_made >= 3:
            print("✅ TXT Report Generation: SIGNIFICANTLY IMPROVED")
        elif improvements_made >= 2:
            print("⚠️ TXT Report Generation: PARTIALLY IMPROVED") 
        else:
            print("❌ TXT Report Generation: NEEDS MORE WORK")
            
        return improvements_made >= 3
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_enhanced_txt_report()
    print(f"\n🎯 Test Result: {'PASS' if success else 'FAIL'}")