"""
CV Optimization Prompt Templates for Gemini Flash 2.0
Optimized for cost efficiency and structured JSON responses
"""

# Main CV optimization prompt template
CV_OPTIMIZATION_TEMPLATE = """You are a professional resume optimization expert. Your task is to optimize the provided CV content to improve ATS (Applicant Tracking System) scores and match the given job requirements.

## CONTEXT:
- The CV has been analyzed by our 6-component ATS scoring system
- Components: Contact Info, Keywords & Skills, Resume Structure, Formatting, Achievements, Readability
- Current penalties and issues are provided for targeted fixes

## JOB REQUIREMENTS:
{job_requirements}

## CURRENT CV CONTENT:
{cv_content}

## ATS ANALYSIS ISSUES TO FIX:
{ats_issues}

## OPTIMIZATION INSTRUCTIONS:
1. **Maintain Original Structure**: Keep the same section order and basic formatting
2. **Fix ATS Penalties**: Address each identified penalty systematically
3. **Add Strategic Keywords**: Integrate job-relevant keywords naturally (not stuffing)
4. **Quantify Achievements**: Add numbers, percentages, metrics where missing
5. **Professional Language**: Enhance with action verbs and impact statements
6. **Skills Alignment**: Ensure skills section matches job requirements

## OUTPUT FORMAT:
Return ONLY a JSON object with this exact structure:

```json
{
  "optimized_sections": {
    "professional_summary": "Enhanced summary text",
    "experience": [
      {
        "company": "Company Name",
        "position": "Job Title", 
        "duration": "Date Range",
        "description": "Optimized bullet points with metrics"
      }
    ],
    "skills": "Optimized skills section",
    "education": "Enhanced education section",
    "contact": "Improved contact information"
  },
  "improvements_made": [
    "Specific improvement 1",
    "Specific improvement 2"
  ],
  "new_keywords": [
    "keyword1",
    "keyword2"
  ],
  "ats_improvements": {
    "score_increase_estimate": 25,
    "penalties_fixed": [
      "penalty1",
      "penalty2"
    ],
    "component_improvements": {
      "contact": 5,
      "keywords": 15,
      "structure": 3,
      "formatting": 2,
      "achievements": 8,
      "readability": 4
    }
  }
}
```

## OPTIMIZATION RULES:
- Focus on fixing existing ATS penalties first
- Add 5-8 strategic keywords naturally throughout
- Quantify at least 60% of achievements with numbers
- Use strong action verbs (achieved, implemented, optimized, etc.)
- Keep professional tone and industry-appropriate language
- Ensure keyword density of 2-3% for target job keywords
"""

# Professional summary enhancement template
PROFESSIONAL_SUMMARY_TEMPLATE = """Optimize this professional summary for ATS and job match:

JOB REQUIREMENTS: {job_requirements}
CURRENT SUMMARY: {current_summary}

Create a 2-3 sentence summary that:
1. Incorporates 3-4 key job requirements naturally
2. Quantifies experience with numbers where possible
3. Uses industry-specific terminology
4. Maintains professional, confident tone

Return only the optimized summary text."""

# Experience section optimization template
EXPERIENCE_OPTIMIZATION_TEMPLATE = """Optimize this work experience section for better ATS scoring:

JOB REQUIREMENTS: {job_requirements}
CURRENT EXPERIENCE: {experience_content}

For each role:
1. Add quantifiable achievements (numbers, percentages, metrics)
2. Incorporate relevant keywords from job requirements
3. Use strong action verbs
4. Focus on results and impact

Return optimized experience section maintaining original structure."""

# Skills section enhancement template
SKILLS_ENHANCEMENT_TEMPLATE = """Enhance this skills section for job alignment:

JOB REQUIREMENTS: {job_requirements}
CURRENT SKILLS: {current_skills}

Optimization goals:
1. Add missing skills from job requirements
2. Organize by relevance and proficiency
3. Include both hard and soft skills
4. Group related skills logically

Return enhanced skills section."""

# Achievement quantification template
ACHIEVEMENT_QUANTIFICATION_TEMPLATE = """Add quantifiable metrics to these achievements:

ACHIEVEMENTS: {achievements}
JOB CONTEXT: {job_context}

For each achievement:
1. Add realistic numbers, percentages, or metrics
2. Include time frames where appropriate
3. Show business impact
4. Use industry-standard KPIs

Return achievements with added quantification."""

# Keyword integration template
KEYWORD_INTEGRATION_TEMPLATE = """Strategically integrate these keywords into the CV content:

TARGET KEYWORDS: {keywords}
CURRENT CONTENT: {content}
SECTION TYPE: {section_type}

Guidelines:
1. Natural integration (avoid keyword stuffing)
2. Maintain readability and flow
3. Use variations and synonyms
4. Context-appropriate placement

Return content with keywords naturally integrated."""