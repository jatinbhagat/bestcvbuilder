#!/usr/bin/env python3
"""
Test CV parser API to check if file_url and content fields are included
"""

import requests
import json
import time

def test_cv_parser():
    """Test the CV parser API with a simple request"""
    
    # Use a public test PDF URL
    test_payload = {
        "file_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        "analysis_type": "comprehensive",
        "include_recommendations": True
    }
    
    API_URL = "https://bestcvbuilder-api.onrender.com/api/cv-parser"
    
    print("🧪 Testing CV Parser API")
    print(f"📡 API URL: {API_URL}")
    print(f"📄 Test PDF: {test_payload['file_url']}")
    
    try:
        print(f"\n🚀 Sending request...")
        
        response = requests.post(
            API_URL,
            json=test_payload,
            headers={"Content-Type": "application/json"},
            timeout=45  # CV analysis can take time
        )
        
        print(f"📈 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS! CV analysis completed")
            
            print(f"\n🔍 Response Keys ({len(result)} total):")
            for key in sorted(result.keys()):
                print(f"  - {key}")
            
            print(f"\n📊 Critical Fields Check:")
            print(f"  - Has file_url: {'file_url' in result}")
            print(f"  - Has content: {'content' in result}")
            print(f"  - Enhanced algorithm: {result.get('enhanced_algorithm_detected', 'Not found')}")
            
            if 'file_url' in result:
                print(f"  - file_url value: {result['file_url']}")
            else:
                print(f"  ❌ file_url MISSING!")
                
            if 'content' in result:
                content_length = len(result['content']) if result['content'] else 0
                print(f"  - content length: {content_length} chars")
                if content_length > 0:
                    print(f"  - content preview: {result['content'][:100]}...")
                else:
                    print(f"  ❌ content is empty!")
            else:
                print(f"  ❌ content MISSING!")
                
            if 'ats_score' in result:
                print(f"  - ATS score: {result['ats_score']}")
            
            # Check if this is the enhanced version
            if result.get('enhanced_algorithm_detected'):
                print(f"✅ Enhanced algorithm is working!")
                return True
            else:
                print(f"⚠️ Enhanced algorithm not detected")
                return False
            
        else:
            print(f"❌ FAILED! Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"📄 Error Response: {json.dumps(error_data, indent=2)}")
            except:
                print(f"📄 Raw Response: {response.text[:500]}")
            return False
                
    except requests.exceptions.Timeout:
        print(f"⏱️ Request timed out (45 seconds)")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 TESTING CV PARSER API FOR ENHANCED FIELDS")
    print("=" * 60)
    
    success = test_cv_parser()
    
    print("=" * 60)
    if success:
        print("🎉 CV Parser working with enhanced fields!")
    else:
        print("❌ CV Parser missing required fields")
    print("=" * 60)