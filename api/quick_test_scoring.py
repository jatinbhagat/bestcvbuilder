#!/usr/bin/env python3
"""
Quick test of scoring functionality to check if our changes work
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'cv-parser'))

def test_scoring():
    """Test the scoring function with sample data"""
    print("🔍 Testing unified ATS scoring...")
    
    sample_resume = """
    John Smith
    Email: john.smith@email.com  
    Phone: (555) 123-4567
    
    PROFESSIONAL SUMMARY
    Experienced software engineer with 5+ years developing scalable applications.
    Achieved 40% performance improvement through optimization initiatives.
    
    EXPERIENCE  
    Senior Software Engineer | TechCorp | 2020-2023
    • Developed web applications serving 100,000+ users
    • Led team of 4 developers on critical projects  
    • Implemented automated testing, reducing bugs by 60%
    
    EDUCATION
    Bachelor of Science in Computer Science | University of Technology | 2018
    
    SKILLS
    Python, JavaScript, React, Node.js, SQL, AWS, Docker, Git
    """
    
    try:
        from index import calculate_comprehensive_ats_score
        
        result = calculate_comprehensive_ats_score(sample_resume)
        
        print(f"✅ Scoring function works!")
        print(f"  comprehensive_final_score: {result.get('comprehensive_final_score')}")
        print(f"  ats_score: {result.get('ats_score')}")
        print(f"  score: {result.get('score')}")
        print(f"  category: {result.get('category')}")
        
        # Check consistency
        comp_score = result.get('comprehensive_final_score')
        ats_score = result.get('ats_score') 
        score = result.get('score')
        
        if comp_score == ats_score == score:
            print("✅ All score fields are consistent")
        else:
            print(f"❌ Score fields inconsistent: comp={comp_score}, ats={ats_score}, score={score}")
            
        return True
        
    except Exception as e:
        print(f"❌ Scoring test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_scoring()
    print(f"\n🎯 Test result: {'PASS' if success else 'FAIL'}")