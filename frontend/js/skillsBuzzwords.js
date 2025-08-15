/**
 * Skills and Buzzwords Configuration Module
 * Loads and manages categorized skills and industry buzzwords for resume analysis
 */

let skillsBuzzwordsConfig = null;

/**
 * Load skills and buzzwords configuration
 */
async function loadSkillsBuzzwords() {
    if (skillsBuzzwordsConfig) {
        return skillsBuzzwordsConfig;
    }
    
    const response = await fetch('./config/skills-buzzwords.json');
    if (!response.ok) {
        throw new Error(`Failed to load skills-buzzwords.json: HTTP ${response.status}`);
    }
    
    skillsBuzzwordsConfig = await response.json();
    return skillsBuzzwordsConfig;
}

/**
 * Get fallback skills and buzzwords configuration
 */
function getFallbackSkillsBuzzwords() {
    return {
        "technicalSkills": [
            "python", "java", "javascript", "react", "node", "sql", "aws", "azure", 
            "docker", "kubernetes", "git", "api", "microservices", "database",
            "machine learning", "data science", "analytics", "cloud"
        ],
        "professionalSkills": [
            "project management", "leadership", "team management", "strategic planning",
            "business analysis", "process improvement", "stakeholder management",
            "cross-functional", "agile", "scrum", "devops", "communication"
        ],
        "industryTerms": [
            "fintech", "healthcare", "e-commerce", "saas", "b2b", "b2c",
            "startup", "enterprise", "compliance", "security", "automation"
        ],
        "skillPatterns": [
            "skilled in", "proficient in", "experienced with", "expertise in"
        ],
        "buzzwords": {
            "general": [
                "drive", "deliver", "optimize", "transform", "innovate", "scale",
                "ROI", "revenue", "growth", "efficiency", "performance"
            ]
        }
    };
}

/**
 * Get all technical skills
 */
function getTechnicalSkills() {
    if (!skillsBuzzwordsConfig) {
        throw new Error('Skills/buzzwords config not loaded - call loadSkillsBuzzwords() first');
    }
    return skillsBuzzwordsConfig.technicalSkills || [];
}

/**
 * Get all professional skills
 */
function getProfessionalSkills() {
    if (!skillsBuzzwordsConfig) {
        console.warn('Skills/buzzwords config not loaded, using fallback');
        return getFallbackSkillsBuzzwords().professionalSkills;
    }
    return skillsBuzzwordsConfig.professionalSkills || [];
}

/**
 * Get all industry terms
 */
function getIndustryTerms() {
    if (!skillsBuzzwordsConfig) {
        console.warn('Skills/buzzwords config not loaded, using fallback');
        return getFallbackSkillsBuzzwords().industryTerms;
    }
    return skillsBuzzwordsConfig.industryTerms || [];
}

/**
 * Get all skills combined
 */
function getAllSkills() {
    return [
        ...getTechnicalSkills(),
        ...getProfessionalSkills(),
        ...getIndustryTerms()
    ];
}

/**
 * Get skill patterns for detection
 */
function getSkillPatterns() {
    if (!skillsBuzzwordsConfig) {
        return getFallbackSkillsBuzzwords().skillPatterns;
    }
    return skillsBuzzwordsConfig.skillPatterns || [];
}

/**
 * Get buzzwords for specific industry
 */
function getBuzzwordsForIndustry(industry) {
    if (!skillsBuzzwordsConfig || !skillsBuzzwordsConfig.buzzwords) {
        return getFallbackSkillsBuzzwords().buzzwords.general || [];
    }
    return skillsBuzzwordsConfig.buzzwords[industry] || [];
}

/**
 * Get all buzzwords combined from all industries
 */
function getAllBuzzwords() {
    if (!skillsBuzzwordsConfig || !skillsBuzzwordsConfig.buzzwords) {
        return getFallbackSkillsBuzzwords().buzzwords.general || [];
    }
    
    const allBuzzwords = [];
    Object.values(skillsBuzzwordsConfig.buzzwords).forEach(industryBuzzwords => {
        allBuzzwords.push(...industryBuzzwords);
    });
    
    // Remove duplicates
    return [...new Set(allBuzzwords)];
}

/**
 * Get industries available in buzzwords config
 */
function getAvailableIndustries() {
    if (!skillsBuzzwordsConfig || !skillsBuzzwordsConfig.buzzwords) {
        return ['general'];
    }
    return Object.keys(skillsBuzzwordsConfig.buzzwords);
}

/**
 * Count skills found in text
 */
function countSkillsInText(text) {
    const allSkills = getAllSkills();
    const lowerText = text.toLowerCase();
    
    const foundSkills = allSkills.filter(skill => {
        return lowerText.includes(skill.toLowerCase());
    });
    
    return {
        count: foundSkills.length,
        skills: foundSkills
    };
}

/**
 * Count buzzwords found in text
 */
function countBuzzwordsInText(text) {
    const allBuzzwords = getAllBuzzwords();
    const lowerText = text.toLowerCase();
    
    const foundBuzzwords = allBuzzwords.filter(buzzword => {
        return lowerText.includes(buzzword.toLowerCase());
    });
    
    return {
        count: foundBuzzwords.length,
        buzzwords: foundBuzzwords
    };
}

/**
 * Analyze text for skills and buzzwords
 */
function analyzeTextForSkillsAndBuzzwords(text) {
    const skillsAnalysis = countSkillsInText(text);
    const buzzwordsAnalysis = countBuzzwordsInText(text);
    
    // Check for skill patterns
    const skillPatterns = getSkillPatterns();
    const hasSkillPatterns = skillPatterns.some(pattern => {
        const regex = new RegExp(pattern, 'gi');
        return regex.test(text);
    });
    
    return {
        skills: skillsAnalysis,
        buzzwords: buzzwordsAnalysis,
        hasSkillPatterns: hasSkillPatterns,
        score: {
            hasSkills: skillsAnalysis.count >= 1 || hasSkillPatterns,
            hasBuzzwords: buzzwordsAnalysis.count >= 2
        }
    };
}

// Initialize skills/buzzwords on module load - MUST SUCCEED
loadSkillsBuzzwords().then(() => {
    console.log('Skills and buzzwords configuration loaded successfully');
}).catch(error => {
    console.error('CRITICAL: Failed to load skills/buzzwords configuration:', error);
    // Retry loading once more
    setTimeout(() => {
        loadSkillsBuzzwords().then(() => {
            console.log('Skills and buzzwords configuration loaded successfully on retry');
        }).catch(retryError => {
            console.error('CRITICAL: Failed to load skills/buzzwords configuration on retry:', retryError);
            // Still export the functions but they will log errors
        });
    }, 1000);
});

// Export functions for use in other modules
window.SkillsBuzzwords = {
    loadSkillsBuzzwords,
    getTechnicalSkills,
    getProfessionalSkills,
    getIndustryTerms,
    getAllSkills,
    getSkillPatterns,
    getBuzzwordsForIndustry,
    getAllBuzzwords,
    getAvailableIndustries,
    countSkillsInText,
    countBuzzwordsInText,
    analyzeTextForSkillsAndBuzzwords
};