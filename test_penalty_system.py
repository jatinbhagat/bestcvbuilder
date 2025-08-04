#!/usr/bin/env python3
"""
Test script for the comprehensive ATS penalty system
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'cv-parser'))

from penalty_system import ATSPenaltySystem

def test_penalty_system():
    """Test the penalty system with sample resume content"""
    
    # Sample resume content with various issues
    sample_resume = """
    John Doe
    johndoe@email.com
    123-456-78  # Truncated phone number
    
    Random Job Title That Doesn't Match Standards
    
    Work History:  # Non-standard heading
    Company A - 2018 to 2020
    Company B - 2016-17  # Inconsistent date format
    
    My Skills: Python, Java
    
    Some text with excessive hyperlinks: https://randomsite.com and https://another.com
    Keywords repeated: Python Python Python Python Python  # Keyword stuffing
    """
    
    penalty_system = ATSPenaltySystem()
    
    # Test with base score of 85
    result = penalty_system.apply_penalties(
        base_score=85,
        content=sample_resume,
        job_posting="Software Engineer position requiring Python and Java skills"
    )
    
    print("🎯 Penalty System Test Results:")
    print(f"Base Score: {result['base_score']}")
    print(f"Final Score: {result['final_score']}")
    print(f"Total Penalty: {result['total_penalty']}")
    print(f"Penalties Applied: {len(result['penalties_applied'])}")
    
    print("\n📊 Penalty Breakdown:")
    for penalty in result['penalties_applied']:
        print(f"  - {penalty['type']}: -{penalty['penalty']} points")
        print(f"    Reason: {penalty['reason']}")
    
    print(f"\n✅ Test completed - Score reduced from 85 to {result['final_score']}")
    
    return result['final_score'] < 85  # Should be lower due to penalties

if __name__ == "__main__":
    success = test_penalty_system()
    print(f"\n{'✅ Test PASSED' if success else '❌ Test FAILED'}")