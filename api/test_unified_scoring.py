#!/usr/bin/env python3
"""
Test script to verify unified ATS scoring system
"""

import sys
import os

# Add paths for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'cv-parser'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'cv-rewrite'))

def test_unified_scoring():
    """Test that all scoring systems use unified logic"""
    
    print("🔍 Testing Unified ATS Scoring System")
    print("=" * 50)
    
    # Test sample resume content
    sample_resume = """
    John Smith
    Email: john.smith@email.com
    Phone: (555) 123-4567
    
    PROFESSIONAL SUMMARY
    Experienced software engineer with 5+ years of experience in full-stack development.
    Achieved 40% increase in application performance through optimization initiatives.
    
    EXPERIENCE
    Senior Software Engineer | TechCorp | 2020-2023
    • Developed scalable web applications serving 100,000+ users
    • Led team of 4 developers on critical projects
    • Implemented automated testing, reducing bugs by 60%
    
    EDUCATION
    Bachelor of Science in Computer Science | University of Technology | 2018
    
    SKILLS
    Python, JavaScript, React, Node.js, SQL, AWS, Docker, Git
    """
    
    try:
        # Test CV Parser scoring
        print("\n1. Testing CV Parser comprehensive scoring...")
        from cv_parser.index import calculate_comprehensive_ats_score
        
        parser_result = calculate_comprehensive_ats_score(sample_resume)
        
        comp_score = parser_result.get('comprehensive_final_score', 0)
        ats_score = parser_result.get('ats_score', 0) 
        score = parser_result.get('score', 0)
        
        print(f"   comprehensive_final_score: {comp_score}")
        print(f"   ats_score: {ats_score}")
        print(f"   score: {score}")
        
        # Check consistency
        if comp_score == ats_score == score:
            print("   ✅ CV Parser scores are consistent")
        else:
            print("   ❌ CV Parser scores are inconsistent")
            
    except Exception as e:
        print(f"   ❌ CV Parser test failed: {str(e)}")
    
    try:
        # Test CV Rewrite scoring
        print("\n2. Testing CV Rewrite scoring...")
        from cv_rewrite.index import analyze_improved_resume
        
        rewrite_result = analyze_improved_resume(sample_resume)
        
        comp_score = rewrite_result.get('comprehensive_final_score', 0)
        ats_score = rewrite_result.get('ats_score', 0)
        score = rewrite_result.get('score', 0)
        
        print(f"   comprehensive_final_score: {comp_score}")
        print(f"   ats_score: {ats_score}")
        print(f"   score: {score}")
        
        # Check consistency
        if comp_score == ats_score == score:
            print("   ✅ CV Rewrite scores are consistent")
        else:
            print("   ❌ CV Rewrite scores are inconsistent")
            
    except Exception as e:
        print(f"   ❌ CV Rewrite test failed: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎯 Unified Scoring Test Complete")
    
if __name__ == "__main__":
    test_unified_scoring()