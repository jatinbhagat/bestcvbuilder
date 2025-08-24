#!/usr/bin/env python3
"""
Performance test to check if unified scoring changes affected processing speed
"""

import time
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'cv-parser'))

def test_scoring_performance():
    """Test the performance of scoring function"""
    
    sample_resume = """
    John Smith
    Email: john.smith@email.com  
    Phone: (555) 123-4567
    LinkedIn: linkedin.com/in/johnsmith
    
    PROFESSIONAL SUMMARY
    Experienced software engineer with 8+ years developing scalable web applications.
    Led multiple teams to deliver 15+ projects ahead of schedule.
    Achieved 40% performance improvement through optimization initiatives.
    Expert in full-stack development with proven track record of success.
    
    EXPERIENCE  
    Senior Software Engineer | TechCorp Inc. | Jan 2020 - Dec 2023
    • Developed scalable web applications serving 100,000+ daily active users
    • Led cross-functional team of 4 developers on critical infrastructure projects
    • Implemented automated testing pipeline, reducing production bugs by 60%
    • Optimized database queries resulting in 35% faster page load times
    • Mentored 3 junior developers and conducted technical interviews
    
    Software Engineer | StartupXYZ | Feb 2018 - Dec 2019
    • Built RESTful APIs handling 10,000+ requests per minute
    • Collaborated with product managers on feature specifications
    • Reduced server response time by 30% through code optimization
    • Implemented CI/CD pipeline reducing deployment time by 50%
    
    Junior Developer | WebTech Solutions | Jun 2016 - Jan 2018
    • Developed responsive web interfaces using modern frameworks
    • Participated in agile development process and sprint planning
    • Fixed over 200 bugs and implemented 50+ feature requests
    
    EDUCATION
    Bachelor of Science in Computer Science | University of Technology | 2016
    Relevant Coursework: Data Structures, Algorithms, Database Systems, Software Engineering
    GPA: 3.8/4.0, Dean's List (4 semesters)
    
    SKILLS
    Programming Languages: Python, JavaScript, TypeScript, Java, C++
    Frameworks: React, Node.js, Django, Flask, Spring Boot
    Databases: PostgreSQL, MongoDB, Redis, MySQL
    Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins, GitHub Actions
    Tools: Git, JIRA, Postman, VS Code, IntelliJ IDEA
    
    CERTIFICATIONS
    • AWS Certified Solutions Architect - Associate (2022)
    • Scrum Master Certification (2021)
    • Google Cloud Professional Developer (2020)
    
    ACHIEVEMENTS
    • Increased system uptime from 95% to 99.9% through infrastructure improvements
    • Led migration of legacy system serving 50,000+ users with zero downtime
    • Published 3 technical articles on Medium with 10,000+ total views
    • Spoke at 2 tech conferences about scalable architecture patterns
    """
    
    print("🚀 Testing ATS Scoring Performance...")
    print("=" * 60)
    
    try:
        from index import calculate_comprehensive_ats_score
        
        # Warm up (first run is often slower)
        print("🔥 Warming up...")
        calculate_comprehensive_ats_score("Test warm up content")
        
        # Performance test
        num_runs = 5
        times = []
        
        print(f"📊 Running {num_runs} performance tests...")
        
        for i in range(num_runs):
            print(f"  Test {i+1}/{num_runs}...", end=" ")
            
            start_time = time.time()
            result = calculate_comprehensive_ats_score(sample_resume)
            end_time = time.time()
            
            duration = end_time - start_time
            times.append(duration)
            
            score = result.get('comprehensive_final_score', result.get('ats_score', 0))
            print(f"✅ {duration:.2f}s (Score: {score})")
        
        # Calculate statistics
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        print("\n📈 Performance Results:")
        print(f"  Average time: {avg_time:.2f}s")
        print(f"  Fastest time: {min_time:.2f}s") 
        print(f"  Slowest time: {max_time:.2f}s")
        print(f"  Time variance: {max_time - min_time:.2f}s")
        
        # Performance assessment
        if avg_time < 5:
            status = "🟢 EXCELLENT"
            message = "Well within 60s timeout"
        elif avg_time < 15:
            status = "🟡 GOOD"
            message = "Acceptable performance"
        elif avg_time < 30:
            status = "🟠 MODERATE"
            message = "Might occasionally timeout"
        else:
            status = "🔴 SLOW"
            message = "May frequently timeout"
            
        print(f"\n🎯 Performance Assessment: {status}")
        print(f"   {message}")
        print(f"   Frontend timeout: 60s")
        print(f"   Safety margin: {60 - avg_time:.1f}s")
        
        return avg_time
        
    except Exception as e:
        print(f"❌ Performance test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    test_scoring_performance()