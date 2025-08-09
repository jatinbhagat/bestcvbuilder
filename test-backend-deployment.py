#!/usr/bin/env python3
"""
Test if the backend CV parser has been deployed with the file_url and content fields
"""

import requests
import json
import time

def test_cv_parser_deployment():
    """Test the deployed CV parser to see if it includes file_url and content"""
    
    # Test with a known working PDF URL 
    test_data = {
        "file_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    }
    
    API_URL = "https://bestcvbuilder-api.onrender.com/api/cv-parser"
    
    print("🧪 Testing Backend CV Parser Deployment")
    print(f"📡 API URL: {API_URL}")
    print(f"📄 Test PDF: {test_data['file_url']}")
    
    try:
        print(f"\n🚀 Sending request...")
        
        response = requests.post(
            API_URL,
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=45
        )
        
        print(f"📈 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS! CV analysis completed")
            
            # Check for the critical fields
            has_file_url = 'file_url' in result
            has_content = 'content' in result
            has_enhanced = result.get('enhanced_algorithm_detected', False)
            
            print(f"\n🔍 Critical Fields Check:")
            print(f"  - Has file_url: {has_file_url}")
            print(f"  - Has content: {has_content}")
            print(f"  - Enhanced algorithm: {has_enhanced}")
            
            if has_file_url:
                print(f"  - file_url value: {result['file_url']}")
            
            if has_content:
                content_length = len(result['content']) if result['content'] else 0
                print(f"  - content length: {content_length} chars")
                if content_length > 0:
                    print(f"  - content sample: {result['content'][:100]}...")
                    
            # Check other enhanced fields
            enhanced_fields = ['critical_issues', 'quick_wins', 'interview_metrics']
            for field in enhanced_fields:
                if field in result:
                    print(f"  ✅ Has {field}")
                else:
                    print(f"  ❌ Missing {field}")
            
            if has_file_url and has_content:
                print(f"\n🎉 DEPLOYMENT SUCCESSFUL! Backend includes required fields")
                return True
            else:
                print(f"\n⚠️ DEPLOYMENT INCOMPLETE! Missing required fields")
                return False
            
        else:
            print(f"❌ API ERROR! Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"📄 Error: {json.dumps(error_data, indent=2)}")
            except:
                print(f"📄 Raw error: {response.text[:500]}")
            return False
                
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 TESTING BACKEND CV PARSER DEPLOYMENT")
    print("=" * 60)
    
    success = test_cv_parser_deployment()
    
    print("=" * 60)
    if success:
        print("✅ Backend is correctly deployed with enhanced fields!")
    else:
        print("❌ Backend deployment issue - needs redeployment")
    print("=" * 60)