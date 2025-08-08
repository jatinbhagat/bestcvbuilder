#!/usr/bin/env python3
"""
Test the fixed API with correct URL
"""

import requests
import json
import time

def test_resume_fix_with_correct_url():
    """Test the resume-fix API with the correct URL"""
    
    # Test data
    test_payload = {
        "original_analysis": {
            "score": 73.8,
            "ats_score": 73.8,
            "content": """Jatin Bhagat
Product Manager
jatin@email.com
(555) 123-4567

PROFESSIONAL SUMMARY:
Experienced product manager with background in tech products.

WORK EXPERIENCE:
Product Manager - TechCorp (2020-2023)
- Developed product strategy
- Worked with engineering teams
- Managed product roadmaps

EDUCATION:
MBA in Business Administration
Tech University (2020)

SKILLS:
Product Management, Strategy, Analytics""",
            "penalties_applied": [
                {"reason": "Missing quantifiable achievements and specific metrics"},
                {"reason": "Lacks industry-specific keywords and technical terms"}
            ]
        },
        "user_email": "jatin@bestcvbuilder.com",
        "payment_id": f"test_fixed_{int(time.time())}"
    }
    
    # Correct API URL (without -znsg)
    API_BASE_URL = "https://bestcvbuilder-api.onrender.com"
    
    print("🧪 Testing Fixed Resume Fix API")
    print(f"📡 API URL: {API_BASE_URL}")
    print(f"📧 Email: {test_payload['user_email']}")
    print(f"📊 Original Score: {test_payload['original_analysis']['score']}")
    
    try:
        print(f"\n🚀 Sending request to {API_BASE_URL}/api/resume-fix...")
        
        # Test the API
        response = requests.post(
            f"{API_BASE_URL}/api/resume-fix",
            json=test_payload,
            headers={
                "Content-Type": "application/json",
                "Origin": "https://bestcvbuilder-frontend.onrender.com"  # Test CORS
            },
            timeout=120
        )
        
        print(f"📈 Response Status: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS! Resume improvement completed")
            print(f"📊 Original Score: {result.get('original_score', 'Unknown')}")
            print(f"📊 New Score: {result.get('new_score', 'Unknown')}")  
            print(f"📊 Score Improvement: +{result.get('score_improvement', 'Unknown')}")
            print(f"📄 PDF URL Available: {'improved_resume_url' in result}")
            
            if 'improved_resume_url' in result:
                pdf_url = result['improved_resume_url']
                if pdf_url.startswith('data:application/pdf;base64,'):
                    print(f"📁 PDF Data URL Length: {len(pdf_url):,} chars")
                else:
                    print(f"📁 PDF URL: {pdf_url}")
            
            print(f"🎯 Feedback Addressed: {len(result.get('feedback_addressed', []))} items")
            
            return True
            
        else:
            print(f"❌ FAILED! Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"📄 Error Response: {error_data}")
            except:
                print(f"📄 Raw Response: {response.text[:500]}...")
            return False
                
    except requests.exceptions.Timeout:
        print(f"⏱️ Request timed out")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 TESTING FIXED RESUME IMPROVEMENT API")
    print("=" * 60)
    
    success = test_resume_fix_with_correct_url()
    
    print("=" * 60)
    if success:
        print("🎉 API is working correctly with real Gemini AI!")
    else:
        print("❌ API test failed - needs more debugging")
    print("=" * 60)