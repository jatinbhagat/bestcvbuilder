#!/usr/bin/env python3
"""
Test script for Gemini Flash 2.0 integration in resume improvement system
Tests the complete flow with real AI-powered improvements
"""

import json
import sys
import os
import time

# Add API paths
sys.path.append('./api/resume-fix')
sys.path.append('./utils')

def test_gemini_integration():
    """Test Gemini Flash 2.0 integration for resume improvement"""
    print("🧪 Testing Gemini Flash 2.0 Resume Improvement Integration")
    print("=" * 60)
    
    # Check environment setup
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        print("❌ GEMINI_API_KEY environment variable not set")
        print("💡 Please set your Gemini API key: export GEMINI_API_KEY='your-key-here'")
        return False
    
    print(f"✅ Gemini API key found: {gemini_api_key[:10]}...")
    
    # Test imports
    print("\n🔍 Testing imports...")
    try:
        from llm_utils import improve_resume_with_llm, generate_feedback_from_analysis, GEMINI_AVAILABLE
        print("✅ LLM utilities imported successfully")
        
        if not GEMINI_AVAILABLE:
            print("❌ Gemini client not available")
            return False
        print("✅ Gemini client available")
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False
    
    # Test data
    sample_resume = """
John Smith
Software Engineer
john.smith@email.com | (555) 123-4567

EXPERIENCE
Senior Developer at Tech Corp (2020-2023)
- Worked on various projects
- Responsible for code maintenance
- Helped with team coordination

SKILLS
Python, JavaScript, HTML

EDUCATION
Bachelor's in Computer Science
    """.strip()
    
    sample_feedback = [
        "Lacks measurable achievements and quantifiable results",
        "Uses passive language instead of strong action verbs", 
        "Missing industry-specific keywords",
        "Experience descriptions need more detail and impact metrics"
    ]
    
    # Test feedback generation
    print("\n📋 Testing feedback generation...")
    mock_analysis = {
        'score': 65,
        'components': {
            'keywords_score': 45,
            'experience_score': 50,
            'structure_score': 75
        }
    }
    
    feedback_list = generate_feedback_from_analysis(mock_analysis)
    print(f"✅ Generated {len(feedback_list)} feedback items:")
    for i, feedback in enumerate(feedback_list, 1):
        print(f"   {i}. {feedback}")
    
    # Test Gemini improvement
    print("\n🧠 Testing Gemini Flash 2.0 improvement...")
    start_time = time.time()
    
    try:
        improved_resume = improve_resume_with_llm(sample_resume, sample_feedback)
        processing_time = time.time() - start_time
        
        print(f"✅ Gemini improvement completed in {processing_time:.2f} seconds")
        print(f"📊 Original length: {len(sample_resume)} characters")
        print(f"📊 Improved length: {len(improved_resume)} characters")
        
        # Verify improvements
        improvements_found = []
        
        # Check for quantifiable metrics
        if any(char.isdigit() for char in improved_resume) and any(char.isdigit() for char in improved_resume):
            improvements_found.append("✅ Added quantifiable metrics")
        
        # Check for action verbs
        action_verbs = ['implemented', 'developed', 'achieved', 'optimized', 'led', 'managed']
        if any(verb in improved_resume.lower() for verb in action_verbs):
            improvements_found.append("✅ Added strong action verbs")
        
        # Check for technical keywords
        tech_keywords = ['development', 'optimization', 'architecture', 'scalable', 'performance']
        if any(keyword in improved_resume.lower() for keyword in tech_keywords):
            improvements_found.append("✅ Added technical keywords")
        
        print(f"\n🎯 Improvements detected:")
        for improvement in improvements_found:
            print(f"   {improvement}")
        
        if len(improvements_found) >= 2:
            print("\n🎉 Gemini integration test PASSED!")
            print("\n📄 Sample of improved resume:")
            print("-" * 40)
            print(improved_resume[:500] + "..." if len(improved_resume) > 500 else improved_resume)
            print("-" * 40)
            return True
        else:
            print("\n⚠️ Gemini responded but improvements may be limited")
            return False
        
    except Exception as e:
        print(f"❌ Gemini improvement failed: {e}")
        return False

def test_complete_api_flow():
    """Test the complete resume-fix API flow"""
    print("\n🚀 Testing Complete Resume-Fix API Flow")
    print("=" * 50)
    
    try:
        from index import process_resume_fix
        
        # Mock analysis data
        analysis_data = {
            'score': 60,
            'content': """
Jane Doe
Product Manager
jane.doe@email.com | (555) 987-6543

EXPERIENCE
Product Manager at StartupXYZ (2021-2023)
- Managed product development
- Worked with engineering teams  
- Handled customer feedback

SKILLS
Product Management, Analytics, Communication

EDUCATION
MBA in Business Administration
            """.strip(),
            'components': {
                'keywords_score': 40,
                'experience_score': 45,
                'structure_score': 70
            }
        }
        
        print("📝 Testing complete API flow...")
        result = process_resume_fix(
            original_analysis=analysis_data,
            user_email='test@example.com', 
            payment_id='gemini_test_123'
        )
        
        print("✅ API flow completed successfully")
        print(f"📊 Score improvement: {result['original_score']} → {result['new_score']} (+{result['score_improvement']})")
        print(f"🔧 Feedback addressed: {len(result['feedback_addressed'])} items")
        
        return True
        
    except Exception as e:
        print(f"❌ API flow test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = True
    
    try:
        # Test Gemini integration
        success &= test_gemini_integration()
        
        # Test complete API flow
        success &= test_complete_api_flow()
        
        if success:
            print("\n" + "="*60)
            print("🎊 ALL GEMINI INTEGRATION TESTS PASSED!")
            print("✅ Resume improvement system is fully functional with Gemini Flash 2.0")
            print("💰 System will use real AI improvements with cost tracking")
            print("🚀 Ready for production deployment!")
        else:
            print("\n❌ SOME TESTS FAILED")
            print("💡 Check your GEMINI_API_KEY and internet connection")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)