"""
Job Analyzer API for BestCVBuilder
Analyzes job descriptions and extracts requirements using NLTK and TextBlob
Following the same patterns as cv-parser/index.py for consistency
"""

import json
import os
import re
import logging
import gc
from typing import Dict, Any, List, Tuple, Optional
from collections import Counter
import traceback

# Import memory management utilities
try:
    from memory_utils import MemoryManager, memory_monitor, force_cleanup, get_memory_info
    MEMORY_UTILS_AVAILABLE = True
except ImportError:
    # Fallback if memory_utils not available
    MEMORY_UTILS_AVAILABLE = False
    def memory_monitor(func):
        return func
    class MemoryManager:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
    def force_cleanup():
        gc.collect()
    def get_memory_info():
        return {}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy loading flags - don't import libraries until needed
NLTK_AVAILABLE = None
TEXTBLOB_AVAILABLE = None

def check_nltk_availability():
    """Lazy check for NLTK availability"""
    global NLTK_AVAILABLE
    if NLTK_AVAILABLE is None:
        try:
            import nltk
            NLTK_AVAILABLE = True
            logger.info("✅ NLTK available for job analysis")
            
            # Download required NLTK data if not present (only essential ones)
            try:
                nltk.data.find('tokenizers/punkt')
                nltk.data.find('corpora/stopwords')
            except LookupError:
                logger.info("📥 Downloading essential NLTK data...")
                nltk.download('punkt', quiet=True)
                nltk.download('stopwords', quiet=True)
                
        except ImportError as e:
            logger.warning(f"⚠️  NLTK not available: {e}")
            NLTK_AVAILABLE = False
    return NLTK_AVAILABLE

def check_textblob_availability():
    """Lazy check for TextBlob availability"""
    global TEXTBLOB_AVAILABLE
    if TEXTBLOB_AVAILABLE is None:
        try:
            from textblob import TextBlob
            TEXTBLOB_AVAILABLE = True
            logger.info("✅ TextBlob available for sentiment analysis")
        except ImportError as e:
            logger.warning(f"⚠️  TextBlob not available: {e}")
            TEXTBLOB_AVAILABLE = False
    return TEXTBLOB_AVAILABLE

def cleanup_memory():
    """Force garbage collection to free memory"""
    if MEMORY_UTILS_AVAILABLE:
        force_cleanup()
    else:
        gc.collect()
    logger.debug("🧹 Memory cleanup performed")

class JobAnalysisError(Exception):
    """Custom exception for job analysis errors"""
    pass

@memory_monitor
def extract_job_requirements(job_description: str, role_title: str = "", company_name: str = "") -> Dict[str, Any]:
    """
    Extract job requirements from job description using NLP
    Returns structured analysis of the job posting
    """
    logger.info("🔍 Starting job requirement extraction")
    
    try:
        # Clean and prepare text
        cleaned_text = clean_job_text(job_description)
        
        # Extract basic information
        basic_info = {
            'role_title': role_title.strip(),
            'company_name': company_name.strip(),
            'description_length': len(job_description),
            'word_count': len(job_description.split())
        }
        
        # Extract requirements using pattern matching (fallback method)
        requirements = extract_requirements_pattern_matching(cleaned_text)
        
        # Enhance with NLP if available (lazy loading)
        if check_nltk_availability():
            nlp_analysis = analyze_with_nltk(cleaned_text)
            requirements.update(nlp_analysis)
            cleanup_memory()  # Clean up after NLTK processing
        
        if check_textblob_availability():
            sentiment_analysis = analyze_sentiment(cleaned_text)
            requirements.update(sentiment_analysis)
            cleanup_memory()  # Clean up after TextBlob processing
        
        # Extract specific job elements
        job_elements = extract_job_elements(cleaned_text)
        
        # Generate analysis score
        analysis_score = calculate_job_analysis_score(requirements, job_elements)
        
        result = {
            'basic_info': basic_info,
            'extracted_requirements': requirements,
            'job_elements': job_elements,
            'analysis_score': analysis_score,
            'matching_keywords': extract_matching_keywords(cleaned_text),
            'priority_skills': identify_priority_skills(cleaned_text),
            'experience_level': determine_experience_level(cleaned_text),
            'job_type': classify_job_type(cleaned_text, role_title)
        }
        
        logger.info(f"✅ Job analysis completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"❌ Error in job requirement extraction: {str(e)}")
        raise JobAnalysisError(f"Failed to analyze job description: {str(e)}")

def clean_job_text(text: str) -> str:
    """Clean and normalize job description text"""
    # Remove HTML tags if present
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters but keep important punctuation
    text = re.sub(r'[^\w\s\.\,\;\:\-\(\)\+\#]', '', text)
    
    return text.strip()

def extract_requirements_pattern_matching(text: str) -> Dict[str, Any]:
    """Extract requirements using regex patterns (works without NLP libraries)"""
    text_lower = text.lower()
    
    # Skills patterns
    skill_patterns = [
        r'(?:experience|proficiency|knowledge|skill|expert|familiar) (?:with|in) ([a-zA-Z0-9\s\,\+\#]+)',
        r'([a-zA-Z0-9\+\#]+)(?:\s+)?(?:experience|skills|knowledge)',
        r'must (?:have|know) ([a-zA-Z0-9\s\,\+\#]+)',
        r'required(?:\:|) ([a-zA-Z0-9\s\,\+\#]+)',
        r'proficient in ([a-zA-Z0-9\s\,\+\#]+)'
    ]
    
    required_skills = set()
    preferred_skills = set()
    
    for pattern in skill_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            # Clean and split skills
            skills = [s.strip() for s in re.split(r'[,;]', match) if len(s.strip()) > 2]
            required_skills.update(skills[:3])  # Limit to prevent noise
    
    # Experience level patterns
    experience_patterns = [
        r'(\d+)[\+\-\s]*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?',
        r'(?:minimum|at least|minimum of) (\d+) (?:years?|yrs?)',
        r'(\d+) (?:to|\-) (\d+) (?:years?|yrs?)'
    ]
    
    experience_requirements = []
    for pattern in experience_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            if isinstance(match, tuple):
                experience_requirements.extend([int(m) for m in match if m.isdigit()])
            else:
                if match.isdigit():
                    experience_requirements.append(int(match))
    
    # Responsibilities patterns
    responsibility_patterns = [
        r'(?:responsible for|will be responsible for|responsibilities include) ([^\.]+)',
        r'(?:you will|duties include|role involves) ([^\.]+)',
        r'(?:key responsibilities|main duties) (?:include|are) ([^\.]+)'
    ]
    
    key_responsibilities = []
    for pattern in responsibility_patterns:
        matches = re.findall(pattern, text_lower)
        key_responsibilities.extend(matches[:5])  # Limit to prevent noise
    
    return {
        'required_skills': list(required_skills)[:10],  # Limit to top 10
        'preferred_skills': list(preferred_skills)[:10],
        'experience_years': experience_requirements[:3] if experience_requirements else [0],
        'key_responsibilities': key_responsibilities[:5],
        'extraction_method': 'pattern_matching'
    }

def analyze_with_nltk(text: str) -> Dict[str, Any]:
    """Enhanced analysis using NLTK"""
    if not NLTK_AVAILABLE:
        return {}
    
    try:
        from nltk.corpus import stopwords
        from nltk.tokenize import word_tokenize, sent_tokenize
        from nltk import pos_tag
        
        # Tokenize
        tokens = word_tokenize(text.lower())
        sentences = sent_tokenize(text)
        
        # Remove stopwords
        stop_words = set(stopwords.words('english'))
        filtered_tokens = [w for w in tokens if w not in stop_words and len(w) > 2]
        
        # Part-of-speech tagging
        pos_tags = pos_tag(filtered_tokens)
        
        # Extract nouns (potential skills/technologies)
        nouns = [word for word, pos in pos_tags if pos in ['NN', 'NNS', 'NNP', 'NNPS']]
        
        # Extract verbs (potential responsibilities)
        verbs = [word for word, pos in pos_tags if pos in ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ']]
        
        # Most common terms
        term_frequency = Counter(filtered_tokens)
        
        return {
            'nltk_analysis': {
                'total_sentences': len(sentences),
                'unique_words': len(set(filtered_tokens)),
                'common_nouns': [word for word, count in Counter(nouns).most_common(10)],
                'common_verbs': [word for word, count in Counter(verbs).most_common(10)],
                'top_terms': [word for word, count in term_frequency.most_common(15)]
            }
        }
        
    except Exception as e:
        logger.warning(f"⚠️  NLTK analysis failed: {e}")
        return {}

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """Analyze job posting sentiment using TextBlob with lazy loading"""
    if not check_textblob_availability():
        return {}
    
    try:
        # Lazy import TextBlob only when needed
        from textblob import TextBlob
        blob = TextBlob(text)
        
        result = {
            'sentiment_analysis': {
                'polarity': round(blob.sentiment.polarity, 3),  # -1 to 1
                'subjectivity': round(blob.sentiment.subjectivity, 3),  # 0 to 1
                'tone': 'positive' if blob.sentiment.polarity > 0.1 else 'negative' if blob.sentiment.polarity < -0.1 else 'neutral'
            }
        }
        
        # Clean up blob object to free memory
        del blob
        return result
        
    except Exception as e:
        logger.warning(f"⚠️  Sentiment analysis failed: {e}")
        return {}

def extract_job_elements(text: str) -> Dict[str, Any]:
    """Extract specific job elements like benefits, location, etc."""
    text_lower = text.lower()
    
    # Benefits patterns
    benefits_keywords = [
        'health insurance', 'dental', 'vision', '401k', 'retirement', 'vacation', 'pto',
        'sick leave', 'flexible hours', 'remote work', 'work from home', 'stock options',
        'bonus', 'competitive salary', 'health benefits', 'medical insurance'
    ]
    
    found_benefits = [benefit for benefit in benefits_keywords if benefit in text_lower]
    
    # Work arrangement patterns
    remote_patterns = [
        'remote', 'work from home', 'telecommute', 'distributed team',
        'flexible location', 'anywhere', 'wfh'
    ]
    
    hybrid_patterns = [
        'hybrid', 'flexible schedule', 'part remote', 'some remote'
    ]
    
    onsite_patterns = [
        'on-site', 'office', 'in-person', 'on location'
    ]
    
    work_arrangement = 'unspecified'
    if any(pattern in text_lower for pattern in remote_patterns):
        work_arrangement = 'remote'
    elif any(pattern in text_lower for pattern in hybrid_patterns):
        work_arrangement = 'hybrid'
    elif any(pattern in text_lower for pattern in onsite_patterns):
        work_arrangement = 'onsite'
    
    # Education requirements
    education_patterns = [
        r"bachelor['\s]*s? degree", r"master['\s]*s? degree", r"phd", r"doctorate",
        r"high school", r"associate degree", r"certification", r"diploma"
    ]
    
    education_requirements = []
    for pattern in education_patterns:
        if re.search(pattern, text_lower):
            education_requirements.append(pattern.replace(r"['\s]*", "'s ").replace(r"\b", ""))
    
    return {
        'benefits': found_benefits,
        'work_arrangement': work_arrangement,
        'education_requirements': education_requirements,
        'urgency_indicators': find_urgency_indicators(text_lower)
    }

def find_urgency_indicators(text: str) -> List[str]:
    """Find indicators of job urgency"""
    urgency_patterns = [
        'urgent', 'immediate start', 'asap', 'as soon as possible',
        'immediate hire', 'start immediately', 'urgent need'
    ]
    
    return [pattern for pattern in urgency_patterns if pattern in text]

def calculate_job_analysis_score(requirements: Dict, job_elements: Dict) -> int:
    """Calculate a job analysis quality score (0-100)"""
    score = 0
    
    # Requirements completeness (40 points)
    if requirements.get('required_skills'):
        score += min(len(requirements['required_skills']) * 4, 20)
    
    if requirements.get('key_responsibilities'):
        score += min(len(requirements['key_responsibilities']) * 4, 20)
    
    # Job elements completeness (30 points)
    if job_elements.get('benefits'):
        score += min(len(job_elements['benefits']) * 2, 10)
    
    if job_elements.get('work_arrangement') != 'unspecified':
        score += 10
    
    if job_elements.get('education_requirements'):
        score += 10
    
    # Experience requirements (20 points)
    if requirements.get('experience_years') and max(requirements['experience_years']) > 0:
        score += 20
    
    # NLP analysis bonus (10 points)
    if requirements.get('nltk_analysis'):
        score += 5
    
    if requirements.get('sentiment_analysis'):
        score += 5
    
    return min(score, 100)

def extract_matching_keywords(text: str) -> List[str]:
    """Extract key matching keywords for resume optimization"""
    text_lower = text.lower()
    
    # Common tech keywords
    tech_keywords = [
        'python', 'javascript', 'java', 'react', 'node.js', 'sql', 'aws', 'docker',
        'kubernetes', 'git', 'api', 'rest', 'graphql', 'mongodb', 'postgresql',
        'machine learning', 'data science', 'ai', 'agile', 'scrum', 'devops'
    ]
    
    # Soft skills keywords
    soft_skills = [
        'leadership', 'communication', 'problem solving', 'teamwork', 'analytical',
        'critical thinking', 'project management', 'collaboration', 'creativity'
    ]
    
    found_keywords = []
    
    for keyword in tech_keywords + soft_skills:
        if keyword in text_lower:
            found_keywords.append(keyword)
    
    return found_keywords[:20]  # Limit to top 20

def identify_priority_skills(text: str) -> List[str]:
    """Identify high-priority skills mentioned multiple times or in key contexts"""
    text_lower = text.lower()
    
    # Priority context indicators
    priority_contexts = [
        'must have', 'required', 'essential', 'critical', 'key', 'primary',
        'strong', 'expert', 'proficient', 'advanced'
    ]
    
    priority_skills = []
    
    for context in priority_contexts:
        # Look for skills mentioned near priority contexts
        pattern = f"{context}[^.]*?([a-zA-Z]+(?:\\s+[a-zA-Z]+)?)"
        matches = re.findall(pattern, text_lower)
        priority_skills.extend(matches[:3])  # Limit to prevent noise
    
    return list(set(priority_skills))[:10]

def determine_experience_level(text: str) -> str:
    """Determine required experience level from job description"""
    text_lower = text.lower()
    
    # Entry level indicators
    entry_patterns = [
        'entry level', 'junior', 'associate', 'graduate', 'new grad',
        '0-2 years', '1-2 years', 'no experience required'
    ]
    
    # Mid level indicators
    mid_patterns = [
        'mid level', 'intermediate', '3-5 years', '2-4 years', '4-6 years'
    ]
    
    # Senior level indicators
    senior_patterns = [
        'senior', 'lead', 'principal', 'architect', '5+ years', '7+ years',
        '10+ years', 'expert', 'advanced'
    ]
    
    if any(pattern in text_lower for pattern in senior_patterns):
        return 'senior'
    elif any(pattern in text_lower for pattern in mid_patterns):
        return 'mid'
    elif any(pattern in text_lower for pattern in entry_patterns):
        return 'entry'
    else:
        return 'unspecified'

def classify_job_type(text: str, role_title: str) -> str:
    """Classify the type of job based on description and title"""
    combined_text = f"{role_title} {text}".lower()
    
    # Job type classifications
    if any(term in combined_text for term in ['engineer', 'developer', 'programmer', 'software']):
        return 'engineering'
    elif any(term in combined_text for term in ['data', 'analyst', 'analytics', 'scientist']):
        return 'data'
    elif any(term in combined_text for term in ['product', 'pm', 'product manager']):
        return 'product'
    elif any(term in combined_text for term in ['design', 'ui', 'ux', 'designer']):
        return 'design'
    elif any(term in combined_text for term in ['marketing', 'sales', 'business development']):
        return 'business'
    elif any(term in combined_text for term in ['hr', 'human resources', 'recruiter']):
        return 'hr'
    else:
        return 'general'

def save_job_analysis_to_database(email: str, analysis_result: Dict[str, Any], session_uuid: str = None) -> Optional[int]:
    """
    Save job analysis results to database
    
    Args:
        email: User email address
        analysis_result: Job analysis results
        session_uuid: Session UUID for anonymous users
        
    Returns:
        Job analysis ID if successful, None otherwise
    """
    try:
        import os
        from supabase import create_client, Client
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found, skipping job analysis save")
            return None
            
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Prepare data for database
        basic_info = analysis_result.get('basic_info', {})
        extracted_requirements = analysis_result.get('extracted_requirements', {})
        user_expectations = analysis_result.get('user_expectations', {})
        
        # Call the database function
        result = supabase.rpc('save_job_analysis_data', {
            'p_email': email,
            'p_role_title': basic_info.get('role_title', ''),
            'p_company_name': basic_info.get('company_name', ''),
            'p_job_description': analysis_result.get('job_description', ''),
            'p_extracted_requirements': extracted_requirements,
            'p_user_expectations': user_expectations,
            'p_analysis_score': analysis_result.get('analysis_score', 0),
            'p_matching_keywords': analysis_result.get('matching_keywords', []),
            'p_priority_skills': analysis_result.get('priority_skills', []),
            'p_experience_level': analysis_result.get('experience_level', 'unspecified'),
            'p_job_type': analysis_result.get('job_type', 'general'),
            'p_processing_info': analysis_result.get('processing_info', {}),
            'p_session_uuid': session_uuid
        }).execute()
        
        if result.data:
            job_analysis_id = result.data
            logger.info(f"Successfully saved job analysis with ID: {job_analysis_id}")
            return job_analysis_id
        else:
            logger.warning("Failed to save job analysis to database")
            return None
            
    except Exception as e:
        logger.error(f"Failed to save job analysis to database: {str(e)}")
        return None

def analyze_job_description(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to analyze job description
    Compatible with the expected API interface
    """
    try:
        job_description = job_data.get('job_description', '')
        role_title = job_data.get('role_title', '')
        company_name = job_data.get('company_name', '')
        user_expectations = job_data.get('user_expectations', {})
        
        if not job_description or len(job_description.strip()) < 50:
            raise JobAnalysisError("Job description is too short or missing")
        
        # Extract job requirements
        analysis_result = extract_job_requirements(job_description, role_title, company_name)
        
        # Add user expectations to result
        analysis_result['user_expectations'] = user_expectations
        analysis_result['job_description'] = job_description  # Store original for database
        
        # Add processing metadata
        analysis_result['processing_info'] = {
            'nltk_available': NLTK_AVAILABLE,
            'textblob_available': TEXTBLOB_AVAILABLE,
            'processing_method': 'pattern_matching' + ('_nltk' if NLTK_AVAILABLE else '') + ('_textblob' if TEXTBLOB_AVAILABLE else '')
        }
        
        logger.info(f"✅ Job analysis completed for: {role_title} at {company_name}")
        return analysis_result
        
    except Exception as e:
        logger.error(f"❌ Job analysis failed: {str(e)}")
        raise JobAnalysisError(f"Analysis failed: {str(e)}")

# For local testing
if __name__ == "__main__":
    # Test the function locally
    test_data = {
        'job_description': '''
        We are seeking a Senior Software Engineer to join our team. The ideal candidate will have 5+ years of experience with Python, JavaScript, and React. 
        
        Responsibilities:
        - Develop and maintain web applications
        - Work with cross-functional teams
        - Code reviews and mentoring junior developers
        
        Requirements:
        - Bachelor's degree in Computer Science
        - Strong experience with Python and JavaScript
        - Experience with React and Node.js
        - Knowledge of AWS and Docker
        - Excellent communication skills
        
        Benefits:
        - Competitive salary
        - Health insurance
        - Remote work options
        - 401k matching
        ''',
        'role_title': 'Senior Software Engineer',
        'company_name': 'Tech Company Inc',
        'user_expectations': {
            'salary_range': {'min': '120000', 'max': '150000'},
            'focus_areas': ['technical', 'leadership'],
            'additional_notes': 'Looking for growth opportunities'
        }
    }
    
    try:
        result = analyze_job_description(test_data)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Test error: {e}")
        traceback.print_exc()