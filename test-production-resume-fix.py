#!/usr/bin/env python3
"""
Test script for production resume-fix API
Tests the complete Gemini AI resume improvement flow
"""

import requests
import json
import os
import time

# Production API URL
API_BASE = "https://bestcvbuilder-api-znsg.onrender.com"

def test_resume_fix_api():
    """Test the resume-fix API endpoint"""
    
    # Test data that mimics real analysis results
    test_payload = {
        "original_analysis": {
            "score": 65,
            "ats_score": 65,
            "content": """John Doe
Software Engineer
john.doe@email.com
(555) 123-4567

PROFESSIONAL SUMMARY:
Experienced software developer with background in web applications.

WORK EXPERIENCE:
Software Developer - TechCorp (2020-2023)
- Developed web applications
- Worked with team members
- Participated in code reviews

Software Intern - StartupCo (2019-2020)  
- Assisted with development tasks
- Learned new technologies

EDUCATION:
Bachelor of Science in Computer Science
University of Technology (2020)

SKILLS:
Python, JavaScript, HTML, CSS, Git""",
            "penalties_applied": [
                {"reason": "Missing quantifiable achievements and specific metrics"},
                {"reason": "Lacks industry-specific keywords and technical terms"},
                {"reason": "Professional summary needs strengthening with specific accomplishments"}
            ],
            "file_url": "https://example.com/sample-resume.pdf"  # Mock URL for testing
        },
        "user_email": "test@bestcvbuilder.com",
        "payment_id": f"test_payment_{int(time.time())}"
    }
    
    print("🧪 Testing Production Resume Fix API")
    print(f"📡 API Base URL: {API_BASE}")
    print(f"📧 Test Email: {test_payload['user_email']}")
    print(f"💳 Payment ID: {test_payload['payment_id']}")
    print(f"📊 Original Score: {test_payload['original_analysis']['score']}")
    print(f"📋 Feedback Items: {len(test_payload['original_analysis']['penalties_applied'])}")
    
    try:
        print(f"\n🚀 Sending request to {API_BASE}/api/resume-fix...")
        
        # Make the API request
        response = requests.post(
            f"{API_BASE}/api/resume-fix",
            json=test_payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "BestCVBuilder-Test/1.0"
            },
            timeout=120  # 2 minute timeout for AI processing
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
                    pdf_size = len(pdf_url)
                    print(f"📁 PDF Data URL Length: {pdf_size:,} chars")
                    print(f"📁 Estimated PDF Size: ~{pdf_size * 0.75 / 1024:.1f} KB")
                else:
                    print(f"📁 PDF URL: {pdf_url}")
            
            if 'feedback_addressed' in result:
                print(f"🎯 Feedback Addressed: {len(result['feedback_addressed'])} items")
                for i, feedback in enumerate(result['feedback_addressed'][:3], 1):
                    print(f"   {i}. {feedback}")
                    
            print(f"⏱️ Processing Status: {result.get('processing_time', 'Unknown')}")
            
            # Save result for inspection
            with open('/tmp/resume_fix_result.json', 'w') as f:
                json.dump(result, f, indent=2)
            print(f"💾 Full result saved to /tmp/resume_fix_result.json")
            
        else:
            print(f"❌ FAILED! Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"📄 Error Response: {error_data}")
            except:
                print(f"📄 Raw Response: {response.text[:500]}...")
                
    except requests.exceptions.Timeout:
        print(f"⏱️ Request timed out - this might indicate the API is processing or unavailable")
        
    except requests.exceptions.ConnectionError:
        print(f"🔌 Connection error - API might be down or unreachable")
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("🏭 PRODUCTION RESUME FIX API TEST")
    print("=" * 60)
    
    test_resume_fix_api()
    
    print("=" * 60)
    print("🏁 Test Complete")
    print("=" * 60)