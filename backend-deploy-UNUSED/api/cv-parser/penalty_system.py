"""
ATS Resume Penalty System
Implements comprehensive penalty system for ATS resume scoring with 9 penalty categories
"""

import json
import re
import os
from typing import Dict, List, Tuple, Any, Optional
from pathlib import Path
from collections import Counter
import logging

logger = logging.getLogger(__name__)

class ATSPenaltySystem:
    """Comprehensive ATS penalty system for resume scoring"""
    
    def __init__(self):
        self.config = self._load_penalty_config()
        self.penalties_applied = []
        
    def _load_penalty_config(self) -> Dict[str, Any]:
        """Load penalty configuration from JSON file"""
        config_path = Path(__file__).parent / 'config' / 'penalty_config.json'
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error(f"Penalty config file not found: {config_path}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Return default penalty configuration if file is not found"""
        return {
            "penalty_weights": {
                "non_standard_job_titles": 5,
                "missing_section_headings": 8,
                "date_format_issues": 6,
                "excessive_formatting": 10,
                "critical_info_in_headers": 12,
                "images_unsupported_types": 8,
                "hyperlinks_keyword_stuffing": 7,
                "knockout_questions": 100,
                "general_ats_compatibility": 3
            }
        }
    
    def apply_penalties(self, base_score: int, content: str, job_posting: str = None, 
                       knockout_questions: List[Dict] = None) -> Dict[str, Any]:
        """
        Apply all penalty categories to the base ATS score
        
        Args:
            base_score: Base ATS score from core algorithm
            content: Resume content text
            job_posting: Job posting text for comparison (optional)
            knockout_questions: List of knockout questions to check (optional)
            
        Returns:
            Dictionary with final score and penalty breakdown
        """
        self.penalties_applied = []
        current_score = base_score
        
        logger.info(f"🎯 Starting penalty analysis with base score: {base_score}")
        
        # 1. Non-standard job titles penalty
        title_penalty = self._check_non_standard_job_titles(content, job_posting)
        current_score = max(0, current_score - title_penalty)
        
        # 2. Missing section headings penalty
        heading_penalty = self._check_missing_section_headings(content)
        current_score = max(0, current_score - heading_penalty)
        
        # 3. Date format issues penalty
        date_penalty = self._check_date_format_issues(content)
        current_score = max(0, current_score - date_penalty)
        
        # 4. Excessive formatting penalty
        format_penalty = self._check_excessive_formatting(content)
        current_score = max(0, current_score - format_penalty)
        
        # 5. Critical info in headers penalty
        header_penalty = self._check_critical_info_in_headers(content)
        current_score = max(0, current_score - header_penalty)
        
        # 6. Images and unsupported types penalty
        image_penalty = self._check_images_unsupported_types(content)
        current_score = max(0, current_score - image_penalty)
        
        # 7. Hyperlinks and keyword stuffing penalty
        keyword_penalty = self._check_hyperlinks_keyword_stuffing(content)
        current_score = max(0, current_score - keyword_penalty)
        
        # 8. Knockout questions penalty (sets score to 0 if failed)
        knockout_penalty = self._check_knockout_questions(content, knockout_questions)
        if knockout_penalty > 0:
            current_score = 0
        
        total_penalty = base_score - current_score
        
        logger.info(f"📊 Penalty analysis complete: {base_score} → {current_score} (penalty: {total_penalty})")
        
        return {
            'final_score': current_score,
            'base_score': base_score,
            'total_penalty': total_penalty,
            'penalties_applied': self.penalties_applied,
            'penalty_breakdown': self._get_penalty_breakdown()
        }
    
    def _check_non_standard_job_titles(self, content: str, job_posting: str = None) -> int:
        """Check for non-standard job titles not matching job posting"""
        penalty = 0
        content_lower = content.lower()
        
        # Extract potential job titles from resume
        job_title_patterns = [
            r'(?:position|role|title):\s*([^\n]+)',
            r'(?:^|\n)([A-Z][A-Za-z\s]+(?:Manager|Engineer|Developer|Analyst|Specialist|Coordinator|Director|Lead))',
            r'(?:experience as|worked as|position of)\s+([A-Za-z\s]+)'
        ]
        
        found_titles = []
        for pattern in job_title_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            found_titles.extend([match.strip() for match in matches])
        
        if not found_titles:
            penalty += self.config['penalty_weights']['non_standard_job_titles']
            self.penalties_applied.append({
                'type': 'non_standard_job_titles',
                'reason': 'No clear job titles found in resume',
                'penalty': self.config['penalty_weights']['non_standard_job_titles']
            })
        else:
            # Check if titles match standard industry terminology
            standard_titles = []
            for category, titles in self.config.get('standard_job_titles', {}).items():
                standard_titles.extend(titles)
            
            non_standard_count = 0
            for title in found_titles[:3]:  # Check first 3 titles
                title_lower = title.lower()
                if not any(std_title in title_lower for std_title in standard_titles):
                    non_standard_count += 1
            
            if non_standard_count > 0:
                penalty += min(non_standard_count * 2, self.config['penalty_weights']['non_standard_job_titles'])
                self.penalties_applied.append({
                    'type': 'non_standard_job_titles',
                    'reason': f'{non_standard_count} non-standard job titles found',
                    'penalty': min(non_standard_count * 2, self.config['penalty_weights']['non_standard_job_titles'])
                })
        
        return penalty
    
    def _check_missing_section_headings(self, content: str) -> int:
        """Check for missing or non-standard section headings"""
        penalty = 0
        content_lower = content.lower()
        
        standard_headings = self.config.get('standard_section_headings', {})
        missing_sections = []
        
        for section_type, headings in standard_headings.items():
            section_found = False
            for heading in headings:
                if heading in content_lower:
                    section_found = True
                    break
            
            if not section_found:
                missing_sections.append(section_type)
        
        if missing_sections:
            section_penalty = len(missing_sections) * 3
            penalty += min(section_penalty, self.config['penalty_weights']['missing_section_headings'])
            self.penalties_applied.append({
                'type': 'missing_section_headings',
                'reason': f'Missing standard sections: {", ".join(missing_sections)}',
                'penalty': min(section_penalty, self.config['penalty_weights']['missing_section_headings'])
            })
        
        return penalty
    
    def _check_date_format_issues(self, content: str) -> int:
        """Check for inconsistent or problematic date formats"""
        penalty = 0
        
        date_patterns = self.config.get('date_format_patterns', {})
        valid_dates = []
        invalid_dates = []
        
        # Check for valid date formats
        for pattern in date_patterns.get('valid_formats', []):
            matches = re.findall(pattern, content)
            valid_dates.extend(matches)
        
        # Check for invalid date formats
        for pattern in date_patterns.get('invalid_patterns', []):
            matches = re.findall(pattern, content)
            invalid_dates.extend(matches)
        
        # Check for employment gaps
        year_pattern = r'\\b(19|20)\\d{2}\\b'
        years = [int(match[0] + match[1]) for match in re.findall(year_pattern, content)]
        years.sort()
        
        gaps = []
        for i in range(1, len(years)):
            gap = years[i] - years[i-1]
            if gap > 1:  # More than 1 year gap
                gaps.append(gap)
        
        issues = []
        if invalid_dates:
            penalty += 3
            issues.append(f'{len(invalid_dates)} invalid date formats')
        
        if len(set(valid_dates)) > 3 and len(invalid_dates) > 0:  # Mixed formats
            penalty += 2
            issues.append('mixed date formats')
        
        if any(gap > 1 for gap in gaps):  # Employment gaps > 1 year
            penalty += 2
            issues.append(f'employment gaps detected')
        
        if penalty > 0:
            penalty = min(penalty, self.config['penalty_weights']['date_format_issues'])
            self.penalties_applied.append({
                'type': 'date_format_issues',
                'reason': '; '.join(issues),
                'penalty': penalty
            })
        
        return penalty
    
    def _check_excessive_formatting(self, content: str) -> int:
        """Check for excessive formatting that hinders ATS parsing"""
        penalty = 0
        issues = []
        
        formatting_config = self.config.get('formatting_issues', {})
        
        # Check for graphics and tables
        for pattern in formatting_config.get('graphics_tables', []):
            if re.search(pattern, content, re.IGNORECASE):
                penalty += 2
                issues.append('graphics/tables detected')
                break
        
        # Check for column layouts
        for pattern in formatting_config.get('columns', []):
            if re.search(pattern, content, re.IGNORECASE):
                penalty += 2
                issues.append('column layout detected')
                break
        
        # Check for non-standard formatting
        html_count = len(re.findall(r'<[^>]+>', content))
        if html_count > 5:
            penalty += 3
            issues.append('excessive HTML formatting')
        
        # Check for special characters that might indicate formatting
        special_chars = len(re.findall(r'[^\w\s\-\.,@():/\n]', content))
        if special_chars > 20:
            penalty += 2
            issues.append('excessive special characters')
        
        if penalty > 0:
            penalty = min(penalty, self.config['penalty_weights']['excessive_formatting'])
            self.penalties_applied.append({
                'type': 'excessive_formatting',
                'reason': '; '.join(issues),
                'penalty': penalty
            })
        
        return penalty
    
    def _check_critical_info_in_headers(self, content: str) -> int:
        """Check if critical information is only in headers/footers"""
        penalty = 0
        
        # This is a simplified check - in practice would need document structure analysis
        lines = content.split('\\n')
        if len(lines) < 10:
            return 0
        
        first_few_lines = ' '.join(lines[:3]).lower()
        last_few_lines = ' '.join(lines[-3:]).lower()
        main_content = ' '.join(lines[3:-3]).lower()
        
        critical_patterns = ['email', 'phone', 'skills', 'experience']
        
        issues = []
        for pattern in critical_patterns:
            if pattern in first_few_lines or pattern in last_few_lines:
                if pattern not in main_content:
                    penalty += 2
                    issues.append(f'{pattern} only in header/footer')
        
        if penalty > 0:
            penalty = min(penalty, self.config['penalty_weights']['critical_info_in_headers'])
            self.penalties_applied.append({
                'type': 'critical_info_in_headers',
                'reason': '; '.join(issues),
                'penalty': penalty
            })
        
        return penalty
    
    def _check_images_unsupported_types(self, content: str) -> int:
        """Check for images or unsupported file type indicators"""
        penalty = 0
        issues = []
        
        # Check for image references
        image_patterns = [
            r'\\.(jpg|jpeg|png|gif|bmp|svg)',
            r'<img[^>]+>',
            r'data:image/',
            r'\\[image\\]',
            r'\\[photo\\]'
        ]
        
        for pattern in image_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                penalty += 3
                issues.append('image references detected')
                break
        
        # Check for unsupported formatting indicators
        if 'base64' in content.lower():
            penalty += 2
            issues.append('base64 encoding detected')
        
        if penalty > 0:
            penalty = min(penalty, self.config['penalty_weights']['images_unsupported_types'])
            self.penalties_applied.append({
                'type': 'images_unsupported_types',
                'reason': '; '.join(issues),
                'penalty': penalty
            })
        
        return penalty
    
    def _check_hyperlinks_keyword_stuffing(self, content: str) -> int:
        """Check for excessive hyperlinks and keyword stuffing"""
        penalty = 0
        issues = []
        
        # Check for hyperlinks (excluding contact info)
        hyperlink_patterns = [
            r'https?://(?!.*(?:linkedin|github|portfolio))',
            r'www\\.(?!.*(?:linkedin|github))',
            r'<a\\s+href'
        ]
        
        hyperlink_count = 0
        for pattern in hyperlink_patterns:
            hyperlink_count += len(re.findall(pattern, content, re.IGNORECASE))
        
        if hyperlink_count > 2:
            penalty += 2
            issues.append(f'{hyperlink_count} non-contact hyperlinks')
        
        # Check for keyword stuffing
        words = content.lower().split()
        word_counts = Counter(words)
        
        # Remove common words
        common_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'a', 'an'}
        
        total_words = len(words)
        stuffing_threshold = self.config.get('keyword_stuffing_threshold', 0.15)
        
        for word, count in word_counts.most_common(20):
            if word not in common_words and len(word) > 3:
                density = count / total_words
                if density > stuffing_threshold:
                    penalty += 1
                    issues.append(f'keyword stuffing: "{word}" ({count} times)')
        
        if penalty > 0:
            penalty = min(penalty, self.config['penalty_weights']['hyperlinks_keyword_stuffing'])
            self.penalties_applied.append({
                'type': 'hyperlinks_keyword_stuffing',
                'reason': '; '.join(issues),
                'penalty': penalty
            })
        
        return penalty
    
    def _check_knockout_questions(self, content: str, knockout_questions: List[Dict] = None) -> int:
        """Check knockout/screening questions - sets score to 0 if failed"""
        if not knockout_questions:
            return 0
        
        penalty = 0
        content_lower = content.lower()
        
        for question in knockout_questions:
            requirement = question.get('requirement', '').lower()
            required = question.get('required', True)
            
            if required and requirement:
                if requirement not in content_lower:
                    penalty = self.config['penalty_weights']['knockout_questions']
                    self.penalties_applied.append({
                        'type': 'knockout_questions',
                        'reason': f'Failed knockout requirement: {requirement}',
                        'penalty': penalty
                    })
                    break
        
        return penalty
    
    def _get_penalty_breakdown(self) -> Dict[str, Any]:
        """Get detailed breakdown of all penalties applied"""
        breakdown = {}
        total_penalty = 0
        
        for penalty in self.penalties_applied:
            penalty_type = penalty['type']
            if penalty_type not in breakdown:
                breakdown[penalty_type] = {
                    'description': self.config['penalty_descriptions'].get(penalty_type, 'Unknown penalty'),
                    'total_penalty': 0,
                    'issues': []
                }
            
            breakdown[penalty_type]['total_penalty'] += penalty['penalty']
            breakdown[penalty_type]['issues'].append(penalty['reason'])
            total_penalty += penalty['penalty']
        
        breakdown['summary'] = {
            'total_penalty': total_penalty,
            'penalties_count': len(self.penalties_applied),
            'categories_affected': len(breakdown) - 1  # Exclude summary
        }
        
        return breakdown


def apply_comprehensive_penalties(base_score: int, content: str, job_posting: str = None, 
                                knockout_questions: List[Dict] = None) -> Dict[str, Any]:
    """
    Main function to apply comprehensive penalty system to ATS score
    
    Args:
        base_score: Base ATS score from core algorithm
        content: Resume content text
        job_posting: Job posting text for comparison (optional)
        knockout_questions: List of knockout questions to check (optional)
        
    Returns:
        Dictionary with final score and penalty breakdown
    """
    penalty_system = ATSPenaltySystem()
    return penalty_system.apply_penalties(base_score, content, job_posting, knockout_questions)