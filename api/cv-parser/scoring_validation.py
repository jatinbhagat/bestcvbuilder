"""
ATS Scoring Validation Module
Tests for consistency between different scoring systems
"""

import logging
from typing import Dict, Any, List
from index import calculate_comprehensive_ats_score, analyze_resume_content

logger = logging.getLogger(__name__)

def validate_scoring_consistency(sample_resume_content: str) -> Dict[str, Any]:
    """
    Validate that all scoring systems produce consistent results
    
    Args:
        sample_resume_content: Sample resume text for testing
        
    Returns:
        Dictionary with validation results
    """
    validation_results = {
        'consistent': True,
        'issues': [],
        'scores': {},
        'details': {}
    }
    
    try:
        # Test comprehensive scoring
        comprehensive_result = calculate_comprehensive_ats_score(sample_resume_content)
        
        validation_results['scores']['comprehensive_final_score'] = comprehensive_result.get('comprehensive_final_score', 0)
        validation_results['scores']['ats_score'] = comprehensive_result.get('ats_score', 0) 
        validation_results['scores']['score'] = comprehensive_result.get('score', 0)
        
        # Check score field consistency
        comp_score = comprehensive_result.get('comprehensive_final_score', 0)
        ats_score = comprehensive_result.get('ats_score', 0)
        score = comprehensive_result.get('score', 0)
        
        if comp_score != ats_score or comp_score != score or ats_score != score:
            validation_results['consistent'] = False
            validation_results['issues'].append(
                f"Score field inconsistency: comprehensive_final_score={comp_score}, "
                f"ats_score={ats_score}, score={score}"
            )
            
        # Test score ranges
        if not (0 <= comp_score <= 100):
            validation_results['consistent'] = False
            validation_results['issues'].append(f"Score out of range: {comp_score}")
            
        validation_results['details']['comprehensive_result'] = comprehensive_result
        
        logger.info(f"Scoring validation completed. Consistent: {validation_results['consistent']}")
        
    except Exception as e:
        validation_results['consistent'] = False
        validation_results['issues'].append(f"Validation error: {str(e)}")
        logger.error(f"Scoring validation failed: {str(e)}")
        
    return validation_results

def test_scoring_with_samples() -> List[Dict[str, Any]]:
    """
    Test scoring with sample resume content
    
    Returns:
        List of validation results for different samples
    """
    sample_resumes = [
        # Sample 1: Good resume
        """
        John Smith
        Email: john.smith@email.com
        Phone: (555) 123-4567
        
        PROFESSIONAL SUMMARY
        Experienced software engineer with 5+ years of experience in full-stack development.
        Achieved 40% increase in application performance through optimization initiatives.
        
        EXPERIENCE
        Senior Software Engineer | TechCorp | 2020-2023
        • Developed scalable web applications serving 100,000+ users
        • Led team of 4 developers on critical projects
        • Implemented automated testing, reducing bugs by 60%
        
        Software Engineer | StartupXYZ | 2018-2020  
        • Built RESTful APIs handling 10,000+ daily requests
        • Collaborated with cross-functional teams on product development
        • Optimized database queries, improving response time by 30%
        
        EDUCATION
        Bachelor of Science in Computer Science | University of Technology | 2018
        
        SKILLS
        Python, JavaScript, React, Node.js, SQL, AWS, Docker, Git
        """,
        
        # Sample 2: Poor resume
        """
        jane doe
        jane@email
        
        i am looking for a job in marketing. i have some experience.
        
        work history:
        - worked at company A
        - did marketing stuff
        - was responsible for social media
        
        education: went to college
        
        skills: good with people, creative, hard working
        """,
        
        # Sample 3: Average resume  
        """
        Michael Johnson
        michael.johnson@email.com
        (555) 987-6543
        
        Marketing Professional with experience in digital marketing campaigns.
        
        WORK EXPERIENCE
        Marketing Specialist | ABC Company | 2021-2023
        Managed social media accounts and created content for marketing campaigns.
        Worked with team to develop marketing strategies.
        
        Marketing Assistant | XYZ Corp | 2019-2021
        Assisted with marketing projects and data analysis.
        
        EDUCATION
        Bachelor's Degree in Marketing | State University | 2019
        
        SKILLS
        Social media marketing, Content creation, Data analysis, Microsoft Office
        """
    ]
    
    results = []
    for i, sample in enumerate(sample_resumes, 1):
        logger.info(f"Testing sample resume {i}")
        result = validate_scoring_consistency(sample)
        result['sample_id'] = i
        results.append(result)
        
    return results

if __name__ == "__main__":
    # Run validation tests
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting ATS scoring validation tests...")
    
    test_results = test_scoring_with_samples()
    
    print("\n=== ATS SCORING VALIDATION RESULTS ===")
    for result in test_results:
        sample_id = result['sample_id']
        consistent = result['consistent']
        print(f"\nSample {sample_id}: {'✅ PASS' if consistent else '❌ FAIL'}")
        
        if result['scores']:
            scores = result['scores']
            print(f"  Scores: {scores}")
            
        if result['issues']:
            print(f"  Issues: {result['issues']}")
            
    # Summary
    total_tests = len(test_results)
    passed_tests = sum(1 for r in test_results if r['consistent'])
    
    print(f"\n=== SUMMARY ===")
    print(f"Tests: {passed_tests}/{total_tests} passed")
    print(f"Overall: {'✅ ALL CONSISTENT' if passed_tests == total_tests else '❌ INCONSISTENCIES FOUND'}")