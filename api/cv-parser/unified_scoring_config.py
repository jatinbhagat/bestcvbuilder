"""
Unified ATS Scoring Configuration Module

This module defines the centralized configuration for all ATS scoring logic
to ensure consistency across CV parser, CV rewrite, and TXT report generation.
"""

from typing import Dict, Any, List, Tuple
import logging

logger = logging.getLogger(__name__)

# Unified scoring field names
UNIFIED_SCORE_FIELDS = {
    'primary': 'comprehensive_final_score',  # Primary unified score field
    'legacy_ats': 'ats_score',              # Legacy field for backward compatibility
    'legacy_score': 'score'                 # Legacy field for backward compatibility
}

# Score validation ranges
SCORE_VALIDATION = {
    'min_score': 0,
    'max_score': 100,
    'default_fallback': 50
}

def get_unified_score(analysis_result: Dict[str, Any]) -> int:
    """
    Extract the unified score from analysis result with proper fallback logic
    
    Args:
        analysis_result: Analysis result dictionary from any scoring system
        
    Returns:
        Unified score value (0-100)
    """
    # Priority order: comprehensive_final_score > score > ats_score > fallback
    score = analysis_result.get(UNIFIED_SCORE_FIELDS['primary'], 
                               analysis_result.get(UNIFIED_SCORE_FIELDS['legacy_score'],
                                                  analysis_result.get(UNIFIED_SCORE_FIELDS['legacy_ats'],
                                                                     SCORE_VALIDATION['default_fallback'])))
    
    # Validate score range
    if not isinstance(score, (int, float)):
        logger.warning(f"Invalid score type: {type(score)}, using fallback")
        return SCORE_VALIDATION['default_fallback']
        
    score = int(score)
    if not (SCORE_VALIDATION['min_score'] <= score <= SCORE_VALIDATION['max_score']):
        logger.warning(f"Score {score} out of range [{SCORE_VALIDATION['min_score']}-{SCORE_VALIDATION['max_score']}], clamping")
        score = max(SCORE_VALIDATION['min_score'], min(score, SCORE_VALIDATION['max_score']))
    
    return score

def create_unified_score_response(score: int, additional_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Create a unified score response format with all required score fields
    
    Args:
        score: The comprehensive final score (0-100)
        additional_data: Additional data to include in response
        
    Returns:
        Dictionary with unified score format
    """
    if additional_data is None:
        additional_data = {}
    
    # Validate input score
    validated_score = max(SCORE_VALIDATION['min_score'], 
                         min(score, SCORE_VALIDATION['max_score']))
    
    if validated_score != score:
        logger.warning(f"Score {score} was clamped to {validated_score}")
    
    # Create unified response
    unified_response = {
        UNIFIED_SCORE_FIELDS['primary']: validated_score,
        UNIFIED_SCORE_FIELDS['legacy_ats']: validated_score,  # Same value for consistency
        UNIFIED_SCORE_FIELDS['legacy_score']: validated_score  # Same value for consistency
    }
    
    # Add additional data
    unified_response.update(additional_data)
    
    return unified_response

def validate_scoring_consistency(result: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate that all score fields in a result are consistent
    
    Args:
        result: Analysis result to validate
        
    Returns:
        Tuple of (is_consistent, list_of_issues)
    """
    issues = []
    
    # Extract all score fields
    comp_score = result.get(UNIFIED_SCORE_FIELDS['primary'])
    ats_score = result.get(UNIFIED_SCORE_FIELDS['legacy_ats'])
    score = result.get(UNIFIED_SCORE_FIELDS['legacy_score'])
    
    # Check if all fields exist
    if comp_score is None:
        issues.append(f"Missing primary score field: {UNIFIED_SCORE_FIELDS['primary']}")
    if ats_score is None:
        issues.append(f"Missing legacy ATS score field: {UNIFIED_SCORE_FIELDS['legacy_ats']}")
    if score is None:
        issues.append(f"Missing legacy score field: {UNIFIED_SCORE_FIELDS['legacy_score']}")
    
    # Check consistency if all fields exist
    if comp_score is not None and ats_score is not None and score is not None:
        if not (comp_score == ats_score == score):
            issues.append(f"Score inconsistency: {UNIFIED_SCORE_FIELDS['primary']}={comp_score}, "
                         f"{UNIFIED_SCORE_FIELDS['legacy_ats']}={ats_score}, "
                         f"{UNIFIED_SCORE_FIELDS['legacy_score']}={score}")
    
    # Check score ranges
    for field_name, field_key in UNIFIED_SCORE_FIELDS.items():
        value = result.get(field_key)
        if value is not None:
            if not isinstance(value, (int, float)):
                issues.append(f"{field_name} ({field_key}) is not numeric: {type(value)}")
            elif not (SCORE_VALIDATION['min_score'] <= value <= SCORE_VALIDATION['max_score']):
                issues.append(f"{field_name} ({field_key}) out of range: {value}")
    
    return len(issues) == 0, issues

def log_scoring_transition_info():
    """Log information about the unified scoring transition for debugging"""
    logger.info("🎯 Unified ATS Scoring Configuration")
    logger.info(f"  Primary field: {UNIFIED_SCORE_FIELDS['primary']}")
    logger.info(f"  Legacy fields: {UNIFIED_SCORE_FIELDS['legacy_ats']}, {UNIFIED_SCORE_FIELDS['legacy_score']}")
    logger.info(f"  Score range: {SCORE_VALIDATION['min_score']}-{SCORE_VALIDATION['max_score']}")
    logger.info("  All scoring systems now use unified comprehensive scoring logic")

# Configuration constants for easy access
PRIMARY_SCORE_FIELD = UNIFIED_SCORE_FIELDS['primary']
LEGACY_ATS_FIELD = UNIFIED_SCORE_FIELDS['legacy_ats'] 
LEGACY_SCORE_FIELD = UNIFIED_SCORE_FIELDS['legacy_score']
MIN_SCORE = SCORE_VALIDATION['min_score']
MAX_SCORE = SCORE_VALIDATION['max_score']
DEFAULT_SCORE = SCORE_VALIDATION['default_fallback']

if __name__ == "__main__":
    # Test the configuration module
    logging.basicConfig(level=logging.INFO)
    
    print("Testing Unified Scoring Configuration...")
    
    # Test unified score extraction
    test_result = {
        'comprehensive_final_score': 85,
        'ats_score': 85,
        'score': 85,
        'other_data': 'test'
    }
    
    score = get_unified_score(test_result)
    print(f"Extracted unified score: {score}")
    
    # Test consistency validation
    is_consistent, issues = validate_scoring_consistency(test_result)
    print(f"Consistency check: {'✅ PASS' if is_consistent else '❌ FAIL'}")
    if issues:
        print(f"Issues: {issues}")
    
    # Test unified response creation
    unified_response = create_unified_score_response(75, {'category': 'good'})
    print(f"Unified response: {unified_response}")
    
    # Log transition info
    log_scoring_transition_info()