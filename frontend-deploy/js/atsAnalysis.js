/**
 * ATS Analysis module for communicating with the Python CV parser API
 * Handles resume analysis and score calculation
 * Updated: 2025-08-08 - Render.com deployment with real Gemini AI
 * Production Ready: Complete CV optimization system functional
 * API: https://bestcvbuilder-api.onrender.com (Render.com backend)
 * Frontend: Static site deployment on Render.com
 */

// API Configuration - Render.com deployment - TIMESTAMP: 2025-08-04
// For local development, use relative URLs. For production, use Render.com API
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction ? 'https://bestcvbuilder-api.onrender.com/api' : '/api';
const CV_PARSER_ENDPOINT = `${API_BASE_URL}/cv-parser`;
const BUILD_VERSION = '3.0.0-RENDER-DEPLOYMENT';
const CACHE_BUSTER = '20250804080000';
const BUILD_ID = 'BUILD-2025-08-04-08:00:00-RENDER-API';

// Export BUILD_ID and API config for main.js to display
export { BUILD_ID, API_BASE_URL, CV_PARSER_ENDPOINT };

console.log('🔗 API Configuration v1.1.0:', { API_BASE_URL, CV_PARSER_ENDPOINT });
console.log('🚨 CRITICAL: Verify this shows correct URL - should NOT be bestcvbuilder-gamma!');


/**
 * Analyze resume using the Python ATS engine
 * @param {string} fileUrl - URL of the uploaded resume file
 * @param {string} userId - Optional user ID for database saving
 * @returns {Promise<Object>} Analysis result with score and recommendations
 */
export async function analyzeResume(fileUrl, userId = null) {
    try {
        console.log('Starting ATS analysis for file:', fileUrl);
        
        const requestBody = {
            file_url: fileUrl,
            analysis_type: 'ats_score',
            include_recommendations: true
        };
        
        // Add user_id if provided for database saving
        if (userId) {
            requestBody.user_id = userId;
            console.log('Including user_id for database saving:', userId);
        }
        
        const response = await fetch(CV_PARSER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const analysisResult = await response.json();
        console.log('ATS analysis completed:', analysisResult);
        
        return processAnalysisResult(analysisResult);
        
    } catch (error) {
        console.error('ATS analysis failed:', error);
        throw error;
    }
}

/**
 * Process and format the analysis result
 * @param {Object} rawResult - Raw API response
 * @returns {Object} Formatted analysis result
 */
function processAnalysisResult(rawResult) {
    return {
        score: rawResult.ats_score || 0,
        scoreCategory: getScoreCategory(rawResult.ats_score),
        strengths: rawResult.strengths || [],
        improvements: rawResult.improvements || [],
        detailedAnalysis: rawResult.detailed_analysis || '',
        keywords: rawResult.keywords || [],
        missingKeywords: rawResult.missing_keywords || [],
        formattingIssues: rawResult.formatting_issues || [],
        suggestions: rawResult.suggestions || [],
        timestamp: new Date().toISOString()
    };
}

/**
 * Get score category based on ATS score
 * @param {number} score - ATS score (0-100)
 * @returns {string} Score category
 */
function getScoreCategory(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    if (score >= 60) return 'poor';
    return 'very_poor';
}

/**
 * Get score description based on category
 * @param {string} category - Score category
 * @returns {string} Human-readable description
 */
export function getScoreDescription(category) {
    const descriptions = {
        excellent: 'Your resume is highly optimized for ATS systems!',
        good: 'Your resume performs well with ATS systems.',
        fair: 'Your resume has room for improvement with ATS systems.',
        poor: 'Your resume needs significant optimization for ATS systems.',
        very_poor: 'Your resume requires major improvements for ATS compatibility.'
    };
    
    return descriptions[category] || 'Score analysis unavailable.';
}

/**
 * Get improvement suggestions based on analysis
 * @param {Object} analysis - Analysis result object
 * @returns {Array} Array of improvement suggestions
 */
export function getImprovementSuggestions(analysis) {
    const suggestions = [];
    
    // Keyword suggestions
    if (analysis.missingKeywords && analysis.missingKeywords.length > 0) {
        suggestions.push({
            type: 'keywords',
            title: 'Add Missing Keywords',
            description: `Consider adding these industry-specific keywords: ${analysis.missingKeywords.join(', ')}`,
            priority: 'high'
        });
    }
    
    // Formatting suggestions
    if (analysis.formattingIssues && analysis.formattingIssues.length > 0) {
        suggestions.push({
            type: 'formatting',
            title: 'Fix Formatting Issues',
            description: analysis.formattingIssues.join(', '),
            priority: 'medium'
        });
    }
    
    // Content suggestions
    if (analysis.suggestions && analysis.suggestions.length > 0) {
        analysis.suggestions.forEach(suggestion => {
            suggestions.push({
                type: 'content',
                title: suggestion.title || 'Content Improvement',
                description: suggestion.description,
                priority: suggestion.priority || 'medium'
            });
        });
    }
    
    return suggestions;
}

/**
 * Calculate potential score improvement
 * @param {Object} analysis - Current analysis result
 * @returns {number} Potential score improvement percentage
 */
export function calculatePotentialImprovement(analysis) {
    const currentScore = analysis.score;
    
    // Use realistic improvement from backend if available
    if (analysis.potential_improvement) {
        return analysis.potential_improvement;
    }
    
    // Fallback to more realistic calculation based on current score
    let maxRealisticImprovement;
    if (currentScore >= 90) {
        maxRealisticImprovement = 5; // Very little room for improvement
    } else if (currentScore >= 80) {
        maxRealisticImprovement = 10; // Some room for improvement
    } else if (currentScore >= 70) {
        maxRealisticImprovement = 15; // Moderate improvement possible
    } else if (currentScore >= 60) {
        maxRealisticImprovement = 20; // Good improvement possible
    } else {
        maxRealisticImprovement = 25; // Significant improvement possible
    }
    
    return maxRealisticImprovement;
}

/**
 * Generate detailed analysis report
 * @param {Object} analysis - Analysis result object
 * @returns {Object} Detailed report object
 */
export function generateDetailedReport(analysis) {
    const scoreCategory = getScoreCategory(analysis.score);
    const potentialImprovement = calculatePotentialImprovement(analysis);
    const suggestions = getImprovementSuggestions(analysis);
    
    return {
        summary: {
            score: analysis.score,
            category: scoreCategory,
            description: getScoreDescription(scoreCategory),
            potentialImprovement: potentialImprovement
        },
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        suggestions: suggestions,
        keywords: {
            found: analysis.keywords,
            missing: analysis.missingKeywords
        },
        formatting: analysis.formattingIssues,
        detailedAnalysis: analysis.detailedAnalysis,
        timestamp: analysis.timestamp
    };
}


// Export the main analysis function (always use production API)
export const analyzeResumeWithFallback = async (fileUrl, userId = null) => {
    return analyzeResume(fileUrl, userId);
}; 