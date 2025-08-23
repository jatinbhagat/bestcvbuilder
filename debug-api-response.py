#!/usr/bin/env python3

"""
Debug script to test API response and check if comprehensive_issues_report field is included
"""

import requests
import json

def test_api_response():
    """Test the API response structure"""
    
    api_url = "https://bestcvbuilder-api.onrender.com/api/cv-parser"
    
    # Use a sample file URL - replace with a real one
    test_data = {
        "file_url": "https://rletapisdadphfdmqdxu.supabase.co/storage/v1/object/public/resumes/user_uploads/sample.pdf"
    }
    
    print("🔍 Testing API response structure...")
    print(f"API URL: {api_url}")
    print(f"Request data: {json.dumps(test_data, indent=2)}")
    
    try:
        # Make the request
        print("\n📡 Making API request...")
        response = requests.post(
            api_url,
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=90
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"\n🔍 Response Fields ({len(data)} total):")
            for i, field in enumerate(sorted(data.keys()), 1):
                print(f"  {i:2d}. {field}")
            
            # Specifically check for comprehensive_issues_report
            print(f"\n🎯 Checking comprehensive_issues_report field:")
            if 'comprehensive_issues_report' in data:
                report = data['comprehensive_issues_report']
                print(f"  ✅ Field exists: YES")
                print(f"  📄 Field type: {type(report)}")
                print(f"  📏 Field value: {report if report is None else f'String with {len(report)} chars' if isinstance(report, str) else 'Non-string value'}")
                
                if isinstance(report, str) and len(report) > 0:
                    print(f"  📝 First 200 chars: {report[:200]}...")
                else:
                    print(f"  ⚠️ Field is None or empty")
            else:
                print(f"  ❌ Field exists: NO")
                print(f"  🔍 Available fields: {list(data.keys())}")
                
            # Check for other related fields
            print(f"\n🔍 Other relevant fields:")
            relevant_fields = ['critical_issues', 'quick_wins', 'content_improvements', 'detailed_issues']
            for field in relevant_fields:
                if field in data:
                    value = data[field]
                    print(f"  ✅ {field}: {type(value)} - {len(value) if isinstance(value, (list, dict, str)) else value}")
                else:
                    print(f"  ❌ {field}: MISSING")
                    
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("⏱️ Request timed out")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_api_response()