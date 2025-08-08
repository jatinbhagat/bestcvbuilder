#!/usr/bin/env python3
"""
Test script for the complete resume fix flow
Tests: Analysis → Payment → Resume Fix → Success Page Data
"""

import json
import sys
import os

# Add API paths
sys.path.append('./api/resume-fix')
sys.path.append('./utils')

def test_complete_flow():
    """Test the complete resume fix flow"""
    print("🧪 Testing Complete Resume Fix Flow")
    print("=" * 50)
    
    # Step 1: Mock analysis data (what would come from cv-parser)
    print("📊 Step 1: Preparing mock analysis data...")
    mock_analysis = {
        'score': 65,
        'ats_score': 65,
        'content': """
John Doe
Senior Software Developer
john.doe@email.com | (555) 123-4567

EXPERIENCE
• Worked on various projects using Python and JavaScript
• Responsible for maintaining code quality
• Helped with team coordination and project management
• Participated in code reviews and testing

SKILLS
Python, JavaScript, HTML, CSS, Git, Agile
        """.strip(),
        'components': {
            'keywords_score': 60,
            'experience_score': 55,
            'structure_score': 70
        },
        'issues': [
            'Lacks measurable achievements',
            'Uses passive language',
            'Missing industry-specific keywords'
        ]
    }
    
    # Step 2: Test the resume fix API
    print("🔧 Step 2: Testing Resume Fix API...")
    try:
        # Import the process function directly
        sys.path.insert(0, './api/resume-fix')
        from index import process_resume_fix
        
        result = process_resume_fix(
            original_analysis=mock_analysis,
            user_email='test@example.com',
            payment_id='test_payment_123'
        )
        
        print(f"✅ API Result: {json.dumps(result, indent=2)}")
        
        # Verify expected fields
        required_fields = [
            'status', 'original_score', 'new_score', 'score_improvement',
            'improved_resume_url', 'feedback_addressed'
        ]
        
        missing_fields = [field for field in required_fields if field not in result]
        if missing_fields:
            print(f"❌ Missing required fields: {missing_fields}")
            return False
        
        # Verify score improvement
        if result['new_score'] <= result['original_score']:
            print(f"❌ Score should improve: {result['original_score']} → {result['new_score']}")
            return False
        
        print(f"✅ Score improved: {result['original_score']} → {result['new_score']} (+{result['score_improvement']})")
        
    except Exception as e:
        print(f"❌ Resume Fix API failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 3: Test success page data format
    print("🎯 Step 3: Testing success page data format...")
    
    # This is what success.js expects in sessionStorage as 'cvRewriteResult'
    expected_success_data = {
        'original_score': result['original_score'],
        'new_score': result['new_score'],
        'score_improvement': result['score_improvement'],
        'improved_resume_url': result['improved_resume_url']
    }
    
    print(f"✅ Success page data: {json.dumps(expected_success_data, indent=2)}")
    
    # Step 4: Summary
    print("📋 Step 4: Flow Summary")
    print(f"   📈 ATS Score: {result['original_score']} → {result['new_score']}")
    print(f"   📊 Improvement: +{result['score_improvement']} points")
    print(f"   🔧 Issues Fixed: {len(result['feedback_addressed'])}")
    print(f"   📄 PDF Generated: {result['improved_resume_url']}")
    
    print("\n🎉 Complete resume fix flow test PASSED!")
    return True

def test_edge_cases():
    """Test edge cases and error handling"""
    print("\n🧪 Testing Edge Cases")
    print("=" * 30)
    
    # Test with minimal data
    print("🔍 Testing with minimal analysis data...")
    try:
        from index import process_resume_fix
        
        minimal_analysis = {
            'score': 45,
            'content': 'Basic resume content'
        }
        
        result = process_resume_fix(
            original_analysis=minimal_analysis,
            user_email='minimal@test.com',
            payment_id='minimal_test'
        )
        
        print(f"✅ Minimal data handled: Score {result['original_score']} → {result['new_score']}")
        
    except Exception as e:
        print(f"❌ Minimal data test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = True
    
    try:
        success &= test_complete_flow()
        success &= test_edge_cases()
        
        if success:
            print("\n🎊 ALL TESTS PASSED!")
            print("✅ Resume fix flow is ready for production!")
        else:
            print("\n❌ SOME TESTS FAILED")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)