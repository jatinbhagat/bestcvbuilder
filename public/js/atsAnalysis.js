/**
 * ATS Analysis module for communicating with the Python CV parser API
 * Handles resume analysis and score calculation
 * Updated: 2025-08-02 - Fixed CORS with relative URLs
 * Force Deploy: Timestamp $(date) - Ensuring fresh deployment
 * TEST: Vercel auto-deploy trigger - Cache bust v2.1
 */

// API Configuration - Use same domain as frontend (relative URL)
const API_BASE_URL = '/api';
const CV_PARSER_ENDPOINT = `${API_BASE_URL}/cv-parser`;

console.log('🔗 API Configuration:', { API_BASE_URL, CV_PARSER_ENDPOINT });


/**
 * Analyze resume using the Python ATS engine
 * @param {string} fileUrl - URL of the uploaded resume file
 * @returns {Promise<Object>} Analysis result with score and recommendations
 */
export async function analyzeResume(fileUrl) {
    try {
        console.log('Starting ATS analysis for file:', fileUrl);
        
        const response = await fetch(CV_PARSER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file_url: fileUrl,
                analysis_type: 'ats_score',
                include_recommendations: true
            })
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
    const maxPossibleScore = 100;
    const potentialImprovement = maxPossibleScore - currentScore;
    
    return Math.min(potentialImprovement, 40); // Cap at 40% improvement
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
export const analyzeResumeWithFallback = async (fileUrl) => {
    return analyzeResume(fileUrl);
}; 