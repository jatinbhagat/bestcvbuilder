#!/usr/bin/env python3
"""
Simple test to check if comprehensive_issues_report field is in API response
"""

import requests
import json

def test_api():
    """Test if comprehensive_issues_report is in the response"""
    
    url = "https://bestcvbuilder-api.onrender.com/api/cv-parser"
    
    # Use a simple file URL for testing  
    data = {
        "file_url": "https://rletapisdadphfdmqdxu.supabase.co/storage/v1/object/public/resumes/sample.pdf"
    }
    
    print("🔍 Testing API response for comprehensive_issues_report field...")
    print(f"URL: {url}")
    
    try:
        response = requests.post(
            url,
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n📊 Response has {len(result)} fields:")
            for i, key in enumerate(sorted(result.keys()), 1):
                print(f"  {i:2d}. {key}")
            
            # Check for the comprehensive report field
            if 'comprehensive_issues_report' in result:
                print(f"\n✅ SUCCESS: comprehensive_issues_report field found!")
                report = result['comprehensive_issues_report']
                if report:
                    print(f"📄 Report length: {len(report)} characters")
                    print(f"📝 Preview:\n{report[:300]}...")
                else:
                    print(f"⚠️ Field exists but value is None/empty")
            else:
                print(f"\n❌ MISSING: comprehensive_issues_report field not found")
                
        elif response.status_code == 400:
            print(f"❌ Bad Request: {response.text}")
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
            
    except requests.exceptions.Timeout:
        print("⏱️ Request timed out")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api()