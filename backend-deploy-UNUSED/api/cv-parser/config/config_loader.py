"""
Configuration loader for ATS algorithm
Loads and manages all configuration data for easy updates and maintenance
"""

import json
import os
from typing import Dict, Any, List
from pathlib import Path

class ConfigLoader:
    """
    Centralized configuration loader for the ATS algorithm
    """
    
    def __init__(self):
        self.config_dir = Path(__file__).parent
        self._cache = {}
        
    def load_config(self, config_name: str) -> Dict[str, Any]:
        """
        Load configuration from JSON file
        
        Args:
            config_name: Name of the config file (without .json extension)
            
        Returns:
            Dictionary containing configuration data
        """
        if config_name in self._cache:
            return self._cache[config_name]
            
        config_file = self.config_dir / f"{config_name}.json"
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
                self._cache[config_name] = config_data
                return config_data
        except FileNotFoundError:
            raise FileNotFoundError(f"Configuration file not found: {config_file}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in config file {config_file}: {e}")
    
    def get_industry_keywords(self) -> Dict[str, Dict[str, List[str]]]:
        """Get industry-specific keywords"""
        return self.load_config('industry_keywords')
    
    def get_language_quality_config(self) -> Dict[str, Any]:
        """Get language quality configuration (grammar, spelling, readability)"""
        return self.load_config('language_quality')
    
    def get_professional_language_config(self) -> Dict[str, Any]:
        """Get professional language configuration (verbs, indicators, etc.)"""
        return self.load_config('professional_language')
    
    def get_ats_scoring_config(self) -> Dict[str, Any]:
        """Get ATS scoring configuration (weights, thresholds, etc.)"""
        return self.load_config('ats_scoring')
    
    def get_grammar_patterns(self) -> List[Dict[str, str]]:
        """Get grammar checking patterns"""
        config = self.get_language_quality_config()
        return config.get('grammar_patterns', [])
    
    def get_spelling_corrections(self) -> Dict[str, Dict[str, str]]:
        """Get spelling correction mappings"""
        config = self.get_language_quality_config()
        return config.get('spelling_corrections', {})
    
    def get_achievement_verbs(self) -> Dict[str, List[str]]:
        """Get achievement verbs by category"""
        config = self.get_professional_language_config()
        return config.get('achievement_verbs', {})
    
    def get_professional_indicators(self) -> Dict[str, List[str]]:
        """Get professional language indicators"""
        config = self.get_professional_language_config()
        return config.get('professional_indicators', {})
    
    def get_quantification_patterns(self) -> Dict[str, List[str]]:
        """Get patterns for detecting quantified achievements"""
        config = self.get_professional_language_config()
        return config.get('quantification_patterns', {})
    
    def get_weak_language(self) -> Dict[str, List[str]]:
        """Get weak language patterns to detect"""
        config = self.get_professional_language_config()
        return config.get('weak_language', {})
    
    def get_strong_replacements(self) -> Dict[str, List[str]]:
        """Get strong replacement suggestions"""
        config = self.get_professional_language_config()
        return config.get('strong_replacements', {})
    
    def get_component_weights(self) -> Dict[str, int]:
        """Get scoring weights for each component"""
        config = self.get_ats_scoring_config()
        return config.get('component_weights', {})
    
    def get_score_categories(self) -> Dict[str, Dict[str, Any]]:
        """Get score category definitions"""
        config = self.get_ats_scoring_config()
        return config.get('score_categories', {})
    
    def get_essential_sections(self) -> Dict[str, List[str]]:
        """Get essential resume sections"""
        config = self.get_ats_scoring_config()
        return config.get('essential_sections', {})
    
    def get_contact_requirements(self) -> Dict[str, Dict[str, Any]]:
        """Get contact information requirements"""
        config = self.get_ats_scoring_config()
        return config.get('contact_requirements', {})
    
    def get_formatting_guidelines(self) -> Dict[str, Any]:
        """Get formatting guidelines"""
        config = self.get_ats_scoring_config()
        return config.get('formatting_guidelines', {})
    
    def get_interview_rate_mapping(self) -> Dict[str, int]:
        """Get interview rate mapping by score"""
        config = self.get_ats_scoring_config()
        return config.get('interview_rate_mapping', {})
    
    def get_readability_metrics(self) -> Dict[str, Any]:
        """Get readability measurement thresholds"""
        config = self.get_language_quality_config()
        return config.get('readability_metrics', {})
    
    def get_keywords_for_industry(self, industry: str) -> List[str]:
        """
        Get all keywords for a specific industry
        
        Args:
            industry: Industry name (e.g., 'technology', 'marketing')
            
        Returns:
            Flat list of all keywords for the industry
        """
        industry_keywords = self.get_industry_keywords()
        
        if industry not in industry_keywords:
            return []
        
        # Flatten all keyword categories for the industry
        all_keywords = []
        for category, keywords in industry_keywords[industry].items():
            all_keywords.extend(keywords)
        
        return list(set(all_keywords))  # Remove duplicates
    
    def get_all_achievement_verbs(self) -> List[str]:
        """Get all achievement verbs as a flat list"""
        achievement_verbs = self.get_achievement_verbs()
        all_verbs = []
        for category, verbs in achievement_verbs.items():
            all_verbs.extend(verbs)
        return list(set(all_verbs))  # Remove duplicates
    
    def get_all_spelling_corrections(self) -> Dict[str, str]:
        """Get all spelling corrections as a flat dictionary"""
        spelling_config = self.get_spelling_corrections()
        all_corrections = {}
        for category, corrections in spelling_config.items():
            all_corrections.update(corrections)
        return all_corrections
    
    def reload_config(self):
        """Clear cache and reload all configurations"""
        self._cache.clear()
    
    def validate_configs(self) -> Dict[str, bool]:
        """
        Validate all configuration files
        
        Returns:
            Dictionary with validation status for each config file
        """
        config_files = [
            'industry_keywords',
            'language_quality', 
            'professional_language',
            'ats_scoring'
        ]
        
        validation_results = {}
        
        for config_name in config_files:
            try:
                self.load_config(config_name)
                validation_results[config_name] = True
            except Exception as e:
                validation_results[config_name] = False
                print(f"Config validation failed for {config_name}: {e}")
        
        return validation_results

# Global configuration loader instance
config_loader = ConfigLoader()

# Convenience functions for easy access
def get_industry_keywords() -> Dict[str, Dict[str, List[str]]]:
    """Get industry keywords configuration"""
    return config_loader.get_industry_keywords()

def get_grammar_patterns() -> List[Dict[str, str]]:
    """Get grammar checking patterns"""
    return config_loader.get_grammar_patterns()

def get_spelling_corrections() -> Dict[str, str]:
    """Get all spelling corrections"""
    return config_loader.get_all_spelling_corrections()

def get_achievement_verbs() -> Dict[str, List[str]]:
    """Get achievement verbs by category"""
    return config_loader.get_achievement_verbs()

def get_professional_indicators() -> Dict[str, List[str]]:
    """Get professional language indicators"""
    return config_loader.get_professional_indicators()

def get_component_weights() -> Dict[str, int]:
    """Get component scoring weights"""
    return config_loader.get_component_weights()

def get_score_categories() -> Dict[str, Dict[str, Any]]:
    """Get score category definitions"""
    return config_loader.get_score_categories()

def get_keywords_for_industry(industry: str) -> List[str]:
    """Get keywords for specific industry"""
    return config_loader.get_keywords_for_industry(industry)