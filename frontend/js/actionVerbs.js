/**
 * Action Verbs Configuration Module
 * Loads and manages categorized strong action verbs for resume analysis
 */

let actionVerbsConfig = null;

/**
 * Load action verbs configuration
 */
async function loadActionVerbs() {
    if (actionVerbsConfig) {
        return actionVerbsConfig;
    }
    
    try {
        const response = await fetch('./config/action-verbs.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        actionVerbsConfig = await response.json();
        return actionVerbsConfig;
    } catch (error) {
        console.warn('Failed to load action verbs config, using fallback:', error);
        // Fallback configuration in case file loading fails
        actionVerbsConfig = getFallbackActionVerbs();
        return actionVerbsConfig;
    }
}

/**
 * Get fallback action verbs configuration
 */
function getFallbackActionVerbs() {
    return {
        "LEADERSHIP_MENTORSHIP_AND_TEACHING_SKILLS": [
            "Led", "Managed", "Directed", "Supervised", "Coached", "Mentored", "Guided", 
            "Spearheaded", "Influenced", "Motivated", "Taught", "Trained", "Developed"
        ],
        "RESEARCH_AND_ANALYSIS_SKILLS": [
            "Analyzed", "Researched", "Investigated", "Evaluated", "Assessed", "Examined", 
            "Identified", "Interpreted", "Forecasted", "Tested", "Diagnosed", "Surveyed"
        ],
        "TEAMWORK_COLLABORATION_SKILLS": [
            "Collaborated", "Cooperated", "Partnered", "Coordinated", "Facilitated", 
            "Supported", "Contributed", "Participated", "Aligned", "Integrated"
        ],
        "STRONG_ACCOMPLISHMENT_DRIVEN_VERBS": [
            "Achieved", "Improved", "Increased", "Reduced", "Eliminated", "Expanded", 
            "Launched", "Created", "Developed", "Implemented", "Optimized", "Streamlined"
        ],
        "WEAK_VERBS": [
            "responsible for", "duties included", "helped with", "assisted in", 
            "involved in", "worked on", "handled", "dealt with"
        ]
    };
}

/**
 * Get verbs for a specific category
 */
function getVerbsForCategory(category) {
    if (!actionVerbsConfig) {
        console.warn('Action verbs config not loaded, using fallback');
        return getFallbackActionVerbs()[category] || [];
    }
    return actionVerbsConfig[category] || [];
}

/**
 * Get all strong verbs (excluding weak verbs)
 */
function getAllStrongVerbs() {
    if (!actionVerbsConfig) {
        const fallback = getFallbackActionVerbs();
        return Object.keys(fallback)
            .filter(key => key !== 'WEAK_VERBS')
            .reduce((acc, key) => acc.concat(fallback[key]), []);
    }
    
    return Object.keys(actionVerbsConfig)
        .filter(key => key !== 'WEAK_VERBS')
        .reduce((acc, key) => acc.concat(actionVerbsConfig[key]), []);
}

/**
 * Count occurrences of verbs from a category in text
 */
function countVerbsInText(text, category) {
    const verbs = getVerbsForCategory(category);
    const lowerText = text.toLowerCase();
    
    return verbs.reduce((count, verb) => {
        const verbLower = verb.toLowerCase();
        // Count whole word matches to avoid partial matches
        const regex = new RegExp(`\\b${verbLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = lowerText.match(regex);
        return count + (matches ? matches.length : 0);
    }, 0);
}

/**
 * Find specific verbs from a category that appear in text
 */
function findVerbsInText(text, category) {
    const verbs = getVerbsForCategory(category);
    const lowerText = text.toLowerCase();
    
    return verbs.filter(verb => {
        const verbLower = verb.toLowerCase();
        const regex = new RegExp(`\\b${verbLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        return regex.test(lowerText);
    });
}

/**
 * Calculate verb strength ratio (strong vs weak verbs)
 */
function calculateVerbStrengthRatio(text) {
    const strongCount = countVerbsInText(text, 'STRONG_ACCOMPLISHMENT_DRIVEN_VERBS');
    const weakCount = countVerbsInText(text, 'WEAK_VERBS');
    
    if (strongCount === 0 && weakCount === 0) {
        return { ratio: 0.5, strongCount: 0, weakCount: 0, total: 0 };
    }
    
    const total = strongCount + weakCount;
    const ratio = total > 0 ? strongCount / total : 0;
    
    return { ratio, strongCount, weakCount, total };
}

/**
 * Get verb diversity score (how many different verb categories are used)
 */
function getVerbDiversityScore(text) {
    const categories = [
        'STRONG_ACCOMPLISHMENT_DRIVEN_VERBS',
        'LEADERSHIP_MENTORSHIP_AND_TEACHING_SKILLS', 
        'RESEARCH_AND_ANALYSIS_SKILLS',
        'MANAGEMENT_SKILLS',
        'COMMUNICATION_SKILLS',
        'ENTREPRENEURIAL_SKILLS'
    ];
    
    const categoriesWithVerbs = categories.filter(category => 
        countVerbsInText(text, category) > 0
    );
    
    return {
        score: Math.min((categoriesWithVerbs.length / categories.length) * 10, 10),
        categoriesUsed: categoriesWithVerbs.length,
        totalCategories: categories.length
    };
}

// Initialize action verbs on module load
loadActionVerbs().then(() => {
    console.log('Action verbs configuration loaded successfully');
}).catch(error => {
    console.warn('Failed to load action verbs configuration:', error);
});

// Export functions for use in other modules
window.ActionVerbs = {
    loadActionVerbs,
    getVerbsForCategory,
    getAllStrongVerbs,
    countVerbsInText,
    findVerbsInText,
    calculateVerbStrengthRatio,
    getVerbDiversityScore
};