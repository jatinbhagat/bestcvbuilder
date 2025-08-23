#!/usr/bin/env python3

"""
Test script to verify the comprehensive_issues_report field is now working
"""

import requests
import json
import sys

def test_comprehensive_report():
    """Test if the comprehensive_issues_report field is included in API response"""
    
    api_url = "https://bestcvbuilder-api.onrender.com/api/cv-parser"
    
    # Test with a sample resume URL (you would need to replace with a real file URL)
    test_data = {
        "file_url": "https://rletapisdadphfdmqdxu.supabase.co/storage/v1/object/public/resumes/test/sample_resume.pdf"
    }
    
    print("🔍 Testing comprehensive_issues_report field inclusion...")
    print(f"API URL: {api_url}")
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(
            api_url,
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print("\n🔍 API Response Fields:")
            fields = list(data.keys())
            for field in sorted(fields):
                print(f"  - {field}")
            
            # Check for comprehensive_issues_report
            if 'comprehensive_issues_report' in data:
                report = data['comprehensive_issues_report']
                if report:
                    print(f"\n✅ SUCCESS: comprehensive_issues_report field found!")
                    print(f"📄 Report length: {len(report)} characters")
                    print(f"📝 Report preview (first 200 chars):")
                    print(f"   {report[:200]}...")
                else:
                    print(f"\n⚠️ WARNING: comprehensive_issues_report field exists but is None/empty")
            else:
                print(f"\n❌ ERROR: comprehensive_issues_report field is MISSING from API response")
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("⏱️ Request timed out")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_comprehensive_report()