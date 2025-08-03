/**
 * Results page JavaScript for displaying ATS analysis results
 * Handles score display, upgrade flow, and user interactions
 */

import { supabase, DatabaseService } from './supabase.js';
import { getScoreDescription, getImprovementSuggestions, calculatePotentialImprovement } from './atsAnalysis.js';

// DOM Elements - Enhanced for new UI
const atsScore = document.getElementById('atsScore');
const scoreTitle = document.getElementById('scoreTitle');
const scoreDescription = document.getElementById('scoreDescription');
const scoreLetter = document.getElementById('scoreLetter');
const scoreCircle = document.getElementById('scoreCircle');
const strengthsList = document.getElementById('strengthsList');
const improvementsList = document.getElementById('improvementsList');
const detailedAnalysis = document.getElementById('detailedAnalysis');
const upgradeBtn = document.getElementById('upgradeBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const downloadReportBtn = document.getElementById('downloadReportBtn');

// New enhanced UI elements
const criticalAlert = document.getElementById('criticalAlert');
const criticalAlertText = document.getElementById('criticalAlertText');
const mainDescription = document.getElementById('mainDescription');
const currentRate = document.getElementById('currentRate');
const potentialRate = document.getElementById('potentialRate');
const impactText = document.getElementById('impactText');
const quickWinsList = document.getElementById('quickWinsList');
const quickWinsCount = document.getElementById('quickWinsCount');
const criticalIssuesList = document.getElementById('criticalIssuesList');
const criticalIssuesCount = document.getElementById('criticalIssuesCount');
const componentScores = document.getElementById('componentScores');
const beforeList = document.getElementById('beforeList');
const afterList = document.getElementById('afterList');
const totalIssuesCount = document.getElementById('totalIssuesCount');
const targetScore = document.getElementById('targetScore');
const scoreImprovement = document.getElementById('scoreImprovement');
const estimatedTime = document.getElementById('estimatedTime');

// Analysis data from session storage
let analysisData = null;

/**
 * Initialize the results page
 */
function init() {
    console.log('Results page initialized');
    loadAnalysisData();
    setupEventListeners();
}

/**
 * Load analysis data from session storage
 */
async function loadAnalysisData() {
    try {
        const storedData = sessionStorage.getItem('atsAnalysis');
        if (!storedData) {
            console.error('No analysis data found');
            showError('No analysis data available. Please upload a resume first.');
            return;
        }
        
        analysisData = JSON.parse(storedData);
        console.log('Loaded analysis data:', analysisData);
    
    // Debug: Check for enhanced algorithm features
    const hasEnhanced = !!(analysisData.critical_issues && analysisData.quick_wins);
    console.log('Enhanced algorithm detected:', hasEnhanced);
    if (hasEnhanced) {
        console.log('Critical issues:', analysisData.critical_issues.length);
        console.log('Quick wins:', analysisData.quick_wins.length);
        console.log('Interview metrics:', !!analysisData.interview_metrics);
    } else {
        console.log('Using legacy format - please upload a new resume to see enhanced features');
    }
        
        displayAnalysisResults();
        
        // Save analysis to database if user is authenticated
        await saveAnalysisToDatabase();
        
    } catch (error) {
        console.error('Error loading analysis data:', error);
        showError('Failed to load analysis results.');
    }
}

/**
 * Display analysis results on the page with enhanced UX
 */
function displayAnalysisResults() {
    if (!analysisData) return;
    
    // Process analysis data to extract insights
    const insights = processAnalysisInsights(analysisData);
    
    // Display critical alert if needed
    displayCriticalAlert(insights);
    
    // Display enhanced ATS score with impact
    displayEnhancedScore(analysisData.score, analysisData.scoreCategory, insights);
    
    // Display quick wins for immediate impact
    displayQuickWins(insights.quickWins);
    
    // Display critical issues with specific solutions
    displayCriticalIssues(insights.criticalIssues);
    
    // Display component breakdown
    displayComponentScores(analysisData.detailedAnalysis);
    
    // Display strengths with enhanced formatting
    displayEnhancedStrengths(analysisData.strengths);
    
    // Display before/after comparison
    displayBeforeAfter(insights);
    
    // Update upgrade section with personalized data
    updateUpgradeSection(insights);
    
    // Store data for payment flow
    sessionStorage.setItem('currentAnalysis', JSON.stringify(analysisData));
}

/**
 * Display enhanced ATS score with impact metrics
 */
function displayEnhancedScore(score, category, insights) {
    if (atsScore) {
        atsScore.textContent = score;
    }
    
    if (scoreLetter) {
        scoreLetter.textContent = getScoreLetter(score);
    }
    
    if (scoreTitle) {
        scoreTitle.textContent = `Your ATS Score: ${getScoreCategoryLabel(category)}`;
    }
    
    if (scoreDescription) {
        scoreDescription.textContent = getEnhancedScoreDescription(category, insights);
    }
    
    // Use enhanced interview metrics if available, otherwise fallback to legacy calculation
    const interviewMetrics = insights.interviewMetrics;
    
    if (currentRate) {
        const currentInterviewRate = interviewMetrics?.current_rate || getInterviewRate(score);
        currentRate.textContent = currentInterviewRate + '%';
    }
    
    if (potentialRate) {
        const potentialInterviewRate = interviewMetrics?.potential_rate || getInterviewRate(Math.min(score + 40, 95));
        potentialRate.textContent = potentialInterviewRate + '%';
    }
    
    if (impactText) {
        if (interviewMetrics && interviewMetrics.improvement_factor) {
            impactText.textContent = `That's ${interviewMetrics.improvement_factor}x more interviews with the right improvements`;
        } else {
            const multiplier = Math.floor(getInterviewRate(Math.min(score + 40, 95)) / getInterviewRate(score));
            impactText.textContent = `That's ${multiplier}x more interviews with the right improvements`;
        }
    }
    
    // Update score circle styling
    updateEnhancedScoreColor(category);
}

/**
 * Get score category label
 */
function getScoreCategoryLabel(category) {
    const labels = {
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor',
        very_poor: 'Very Poor'
    };
    
    return labels[category] || 'Unknown';
}

/**
 * Update enhanced score circle styling based on category
 */
function updateEnhancedScoreColor(category) {
    if (!scoreCircle || !atsScore || !scoreLetter) return;
    
    // Remove existing color classes
    scoreCircle.classList.remove('bg-green-100', 'bg-blue-100', 'bg-yellow-100', 'bg-red-100', 'bg-red-200');
    atsScore.classList.remove('text-green-600', 'text-blue-600', 'text-yellow-600', 'text-red-600', 'text-red-700');
    scoreLetter.classList.remove('text-green-600', 'text-blue-600', 'text-yellow-600', 'text-red-600', 'text-red-700');
    
    // Add appropriate color classes with enhanced styling
    switch (category) {
        case 'excellent':
            scoreCircle.classList.add('bg-green-100', 'border-4', 'border-green-300');
            atsScore.classList.add('text-green-600');
            scoreLetter.classList.add('text-green-600');
            break;
        case 'good':
            scoreCircle.classList.add('bg-blue-100', 'border-4', 'border-blue-300');
            atsScore.classList.add('text-blue-600');
            scoreLetter.classList.add('text-blue-600');
            break;
        case 'fair':
            scoreCircle.classList.add('bg-yellow-100', 'border-4', 'border-yellow-300');
            atsScore.classList.add('text-yellow-600');
            scoreLetter.classList.add('text-yellow-600');
            break;
        case 'poor':
            scoreCircle.classList.add('bg-red-100', 'border-4', 'border-red-300');
            atsScore.classList.add('text-red-600');
            scoreLetter.classList.add('text-red-600');
            break;
        case 'very_poor':
            scoreCircle.classList.add('bg-red-200', 'border-4', 'border-red-400');
            atsScore.classList.add('text-red-700');
            scoreLetter.classList.add('text-red-700');
            break;
    }
}

/**
 * Display enhanced strengths with better formatting
 */
function displayEnhancedStrengths(strengths) {
    if (!strengthsList || !strengths) return;
    
    strengthsList.innerHTML = '';
    
    strengths.forEach(strength => {
        const div = document.createElement('div');
        div.className = 'bg-green-50 border border-green-200 rounded-lg p-3 flex items-start';
        div.innerHTML = `
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-gray-700 text-sm font-medium">${strength}</span>
        `;
        strengthsList.appendChild(div);
    });
}

// This function is replaced by displayQuickWins and displayCriticalIssues
// Keeping for backward compatibility but not used in enhanced UI

/**
 * Display detailed analysis
 */
function displayDetailedAnalysis(analysis) {
    if (!detailedAnalysis || !analysis) return;
    
    // Handle both string and object formats
    if (typeof analysis === 'string') {
        detailedAnalysis.innerHTML = `
            <p class="text-gray-700 leading-relaxed">${analysis}</p>
        `;
        return;
    }
    
    // Handle object format (component breakdown)
    if (typeof analysis === 'object') {
        let html = '<div class="space-y-4">';
        
        // Iterate through analysis components
        Object.entries(analysis).forEach(([component, data]) => {
            if (data && typeof data === 'object' && data.score !== undefined) {
                const percentage = Math.round((data.score / getMaxScore(component)) * 100);
                const componentName = formatComponentName(component);
                
                html += `
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-semibold text-gray-900">${componentName}</h4>
                            <span class="text-sm font-medium ${getScoreColor(percentage)}">${data.score} points (${percentage}%)</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                        ${formatComponentDetails(data)}
                    </div>
                `;
            }
        });
        
        html += '</div>';
        detailedAnalysis.innerHTML = html;
    }
}

/**
 * Get maximum possible score for a component
 */
function getMaxScore(component) {
    const maxScores = {
        'structure': 25,
        'keywords': 20,
        'contact': 15,
        'formatting': 20,
        'achievements': 10,
        'readability': 10
    };
    return maxScores[component] || 20;
}

/**
 * Format component name for display
 */
function formatComponentName(component) {
    const names = {
        'structure': 'Resume Structure',
        'keywords': 'Keywords & Skills',
        'contact': 'Contact Information',
        'formatting': 'Formatting & Layout',
        'achievements': 'Achievements & Impact',
        'readability': 'Readability & Clarity'
    };
    return names[component] || component.charAt(0).toUpperCase() + component.slice(1);
}

/**
 * Get score color class based on percentage
 */
function getScoreColor(percentage) {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
}

/**
 * Format component details for display
 */
function formatComponentDetails(data) {
    let details = '';
    
    // Show specific details based on what's available
    if (data.missing_sections && data.missing_sections.length > 0) {
        details += `<p class="text-sm text-red-600 mb-1"><strong>Missing:</strong> ${data.missing_sections.join(', ')}</p>`;
    }
    
    if (data.found_keywords && data.found_keywords.length > 0) {
        details += `<p class="text-sm text-green-600 mb-1"><strong>Found Keywords:</strong> ${data.found_keywords.slice(0, 5).join(', ')}${data.found_keywords.length > 5 ? '...' : ''}</p>`;
    }
    
    if (data.missing_keywords && data.missing_keywords.length > 0) {
        details += `<p class="text-sm text-yellow-600 mb-1"><strong>Consider Adding:</strong> ${data.missing_keywords.slice(0, 3).join(', ')}${data.missing_keywords.length > 3 ? '...' : ''}</p>`;
    }
    
    if (data.achievements_count !== undefined) {
        details += `<p class="text-sm text-gray-600"><strong>Quantified Achievements:</strong> ${data.achievements_count}</p>`;
    }
    
    return details || '<p class="text-sm text-gray-600">Component analyzed successfully</p>';
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Upgrade button
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', handleUpgrade);
    }
    
    // New analysis button
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', handleNewAnalysis);
    }
    
    // Download report button
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', handleDownloadReport);
    }
}

/**
 * Handle upgrade button click
 */
function handleUpgrade() {
    console.log('User clicked upgrade');
    
    // Store analysis data for payment flow
    if (analysisData) {
        sessionStorage.setItem('upgradeAnalysis', JSON.stringify(analysisData));
    }
    
    // Redirect to payment page
    window.location.href = './payment.html';
}

/**
 * Handle new analysis button click
 */
function handleNewAnalysis() {
    console.log('User wants new analysis');
    
    // Clear session storage
    sessionStorage.removeItem('atsAnalysis');
    sessionStorage.removeItem('currentAnalysis');
    
    // Redirect to home page
    window.location.href = './index.html';
}

/**
 * Handle download report button click
 */
async function handleDownloadReport() {
    try {
        console.log('Generating downloadable report');
        
        const report = generateDownloadableReport();
        downloadReport(report);
        
    } catch (error) {
        console.error('Error generating report:', error);
        showError('Failed to generate report.');
    }
}

/**
 * Generate downloadable report
 */
function generateDownloadableReport() {
    if (!analysisData) return null;
    
    const potentialImprovement = calculatePotentialImprovement(analysisData);
    const suggestions = getImprovementSuggestions(analysisData);
    
    return {
        title: 'ATS Analysis Report',
        score: analysisData.score,
        category: analysisData.scoreCategory,
        description: getScoreDescription(analysisData.scoreCategory),
        strengths: analysisData.strengths,
        improvements: analysisData.improvements,
        suggestions: suggestions,
        potentialImprovement: potentialImprovement,
        detailedAnalysis: analysisData.detailedAnalysis,
        timestamp: analysisData.timestamp
    };
}

/**
 * Download report as JSON file
 */
function downloadReport(report) {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ats-analysis-report-${Date.now()}.json`;
    link.click();
}

/**
 * Show error message
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

/**
 * Save analysis result to database (if user is authenticated)
 */
async function saveAnalysisToDatabase() {
    try {
        const user = await supabase.auth.getUser();
        if (user.data.user && analysisData) {
            await DatabaseService.saveAnalysisResult(user.data.user.id, analysisData);
            console.log('Analysis saved to database');
        }
    } catch (error) {
        console.error('Failed to save analysis to database:', error);
    }
}

/**
 * Process analysis data to extract actionable insights
 */
function processAnalysisInsights(data) {
    // Check if the data already has enhanced structure from new algorithm
    if (data.critical_issues && data.quick_wins) {
        // Use the new enhanced algorithm data directly
        return {
            quickWins: data.quick_wins || [],
            criticalIssues: data.critical_issues || [],
            beforeItems: data.transformation_preview?.before || generateBeforeItems(data),
            afterItems: data.transformation_preview?.after || generateAfterItems(data),
            totalIssues: (data.critical_issues?.length || 0) + (data.quick_wins?.length || 0),
            interviewMetrics: data.interview_metrics || null,
            transformationPreview: data.transformation_preview || null
        };
    }
    
    // Fallback to legacy processing for older data format
    const quickWins = [];
    const criticalIssues = [];
    const beforeItems = [];
    const afterItems = [];
    
    // Extract quick wins (2-minute fixes)
    if (data.improvements && data.improvements.length > 0) {
        data.improvements.forEach(improvement => {
            if (isQuickWin(improvement)) {
                quickWins.push({
                    title: improvement,
                    time_to_fix: '2 minutes',
                    impact: 'High',
                    points_gain: 5,
                    icon: 'lightning'
                });
            } else {
                criticalIssues.push({
                    title: improvement,
                    time_to_fix: '10-15 minutes',
                    impact: 'High',
                    points_gain: 10,
                    solution: getSpecificSolution(improvement)
                });
            }
        });
    }
    
    // Add component-based insights if detailed analysis is available
    if (data.detailedAnalysis && typeof data.detailedAnalysis === 'object') {
        Object.entries(data.detailedAnalysis).forEach(([component, componentData]) => {
            if (componentData && componentData.missing_sections) {
                componentData.missing_sections.forEach(missing => {
                    criticalIssues.push({
                        title: `Missing ${missing} section`,
                        component: formatComponentName(component),
                        solution: `Add a dedicated ${missing} section to your resume`,
                        time_to_fix: '5-10 minutes',
                        impact: 'High',
                        points_gain: 8
                    });
                });
            }
            
            if (componentData && componentData.missing_keywords && componentData.missing_keywords.length > 0) {
                quickWins.push({
                    title: `Add ${componentData.missing_keywords.slice(0, 3).join(', ')} keywords`,
                    component: formatComponentName(component),
                    time_to_fix: '1-2 minutes',
                    impact: 'Medium',
                    points_gain: 3,
                    icon: 'keyword'
                });
            }
        });
    }
    
    // Generate before/after items
    beforeItems.push(`ATS Score: ${data.score}/100`);
    afterItems.push(`ATS Score: ${Math.min(data.score + 40, 95)}/100`);
    
    if (quickWins.length > 0) {
        beforeItems.push(`Missing key optimizations`);
        afterItems.push(`Fully optimized with industry keywords`);
    }
    
    if (criticalIssues.length > 0) {
        beforeItems.push(`${criticalIssues.length} critical formatting issues`);
        afterItems.push(`Professional ATS-friendly formatting`);
    }
    
    beforeItems.push(`${getInterviewRate(data.score)}% interview rate`);
    afterItems.push(`${getInterviewRate(Math.min(data.score + 40, 95))}% interview rate`);
    
    return {
        quickWins: quickWins.slice(0, 3), // Limit to top 3
        criticalIssues: criticalIssues.slice(0, 5), // Limit to top 5
        beforeItems,
        afterItems,
        totalIssues: quickWins.length + criticalIssues.length
    };
}

/**
 * Generate before items for transformation preview
 */
function generateBeforeItems(data) {
    const items = [`ATS Score: ${data.score}/100`];
    if (data.scoreCategory === 'poor' || data.scoreCategory === 'very_poor') {
        items.push('Poor ATS compatibility');
        items.push('Missing critical sections');
    }
    items.push(`${getInterviewRate(data.score)}% interview rate`);
    return items;
}

/**
 * Generate after items for transformation preview
 */
function generateAfterItems(data) {
    const targetScore = Math.min(data.score + 40, 95);
    const items = [`ATS Score: ${targetScore}/100`];
    items.push('Fully ATS-optimized');
    items.push('Professional structure');
    items.push(`${getInterviewRate(targetScore)}% interview rate`);
    return items;
}

/**
 * Check if an improvement is a quick win (can be fixed in under 2 minutes)
 */
function isQuickWin(improvement) {
    const quickWinPatterns = [
        /phone/i, /email/i, /contact/i, /linkedin/i,
        /keyword/i, /skill/i, /bullet/i, /spacing/i,
        /margin/i, /font/i, /bold/i, /italic/i
    ];
    
    return quickWinPatterns.some(pattern => pattern.test(improvement));
}

/**
 * Get specific solution for an improvement
 */
function getSpecificSolution(improvement) {
    const solutions = {
        'missing contact information': 'Add your phone number, email, and LinkedIn profile URL at the top',
        'no professional summary': 'Write a 2-3 sentence summary highlighting your key qualifications',
        'weak achievement descriptions': 'Rewrite accomplishments using numbers and action verbs',
        'poor keyword optimization': 'Research job descriptions and add relevant industry keywords',
        'formatting inconsistencies': 'Use consistent fonts, spacing, and bullet point styles',
        'missing skills section': 'Create a dedicated skills section with 8-12 relevant technical skills'
    };
    
    // Find matching solution or provide generic advice
    const lowerImprovement = improvement.toLowerCase();
    for (const [key, solution] of Object.entries(solutions)) {
        if (lowerImprovement.includes(key)) {
            return solution;
        }
    }
    
    return 'Review and optimize this section for better ATS compatibility';
}

/**
 * Get score letter grade
 */
function getScoreLetter(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

/**
 * Get enhanced score description with specific insights
 */
function getEnhancedScoreDescription(category, insights) {
    // Use enhanced algorithm description if available
    if (insights.transformationPreview && insights.transformationPreview.summary) {
        return insights.transformationPreview.summary;
    }
    
    // Fallback to category-based descriptions
    const descriptions = {
        excellent: `Outstanding! Your resume is highly optimized for ATS systems.`,
        good: `Good performance, but ${insights.totalIssues} improvements could boost your score significantly.`,
        fair: `Your resume needs attention. ${insights.criticalIssues?.length || 0} critical issues are blocking ATS systems.`,
        poor: `Major optimization needed. ${insights.totalIssues} issues are preventing interviews.`,
        very_poor: `Critical problems detected. Your resume likely won't pass ATS screening.`
    };
    
    return descriptions[category] || 'Analysis complete - see details below.';
}

/**
 * Calculate interview rate based on ATS score
 */
function getInterviewRate(score) {
    if (score >= 85) return 15;
    if (score >= 75) return 8;
    if (score >= 65) return 5;
    if (score >= 55) return 3;
    return 2;
}

/**
 * Display critical alert if score is very low
 */
function displayCriticalAlert(insights) {
    if (!criticalAlert || insights.criticalIssues.length < 3) return;
    
    criticalAlert.classList.remove('hidden');
    if (criticalAlertText) {
        criticalAlertText.textContent = `${insights.criticalIssues.length} critical issues are preventing your resume from passing ATS systems.`;
    }
}

/**
 * Display quick wins section with mobile-optimized layout
 */
function displayQuickWins(quickWins) {
    if (!quickWinsList || !quickWinsCount) return;
    
    quickWinsCount.textContent = `${quickWins.length} fixes`;
    quickWinsList.innerHTML = '';
    
    if (quickWins.length === 0) {
        quickWinsList.innerHTML = '<p class="text-blue-700 text-sm">Great! No quick fixes needed - you have the basics covered.</p>';
        return;
    }
    
    quickWins.forEach(win => {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-lg p-3 md:p-4 border border-blue-200 hover:border-blue-300 transition-colors touch-manipulation';
        
        // Handle both new and legacy data formats
        const timeToFix = win.time_to_fix || win.timeToFix || '2 minutes';
        const impact = win.impact || 'Medium';
        const pointsGain = win.points_gain || win.pointsGain || 3;
        
        div.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 text-sm leading-tight">${win.title}</h4>
                    ${win.component ? `<p class="text-xs text-gray-500 mt-1 truncate">${win.component}</p>` : ''}
                    ${pointsGain ? `<p class="text-xs text-green-600 mt-1">+${pointsGain} points</p>` : ''}
                </div>
                <div class="text-right ml-3 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600 block">${timeToFix}</span>
                    <span class="text-xs text-gray-500">${impact} impact</span>
                </div>
            </div>
        `;
        quickWinsList.appendChild(div);
    });
}

/**
 * Display critical issues section with mobile-optimized layout
 */
function displayCriticalIssues(criticalIssues) {
    if (!criticalIssuesList || !criticalIssuesCount) return;
    
    criticalIssuesCount.textContent = `${criticalIssues.length} issues`;
    criticalIssuesList.innerHTML = '';
    
    if (criticalIssues.length === 0) {
        criticalIssuesList.innerHTML = '<p class="text-green-700 text-sm">Excellent! No critical issues found.</p>';
        return;
    }
    
    criticalIssues.forEach(issue => {
        const div = document.createElement('div');
        div.className = 'bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 hover:border-red-300 transition-colors touch-manipulation';
        
        // Handle both new and legacy data formats
        const timeToFix = issue.time_to_fix || issue.timeToFix || '10-15 minutes';
        const impact = issue.impact || 'High';
        const pointsGain = issue.points_gain || issue.pointsGain;
        const solution = issue.solution || issue.description || 'Review and optimize this section for better ATS compatibility';
        
        div.innerHTML = `
            <div class="flex items-start">
                <svg class="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"></path>
                </svg>
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 text-sm md:text-base leading-tight">${issue.title}</h4>
                    ${issue.component ? `<p class="text-xs md:text-sm text-gray-600 mt-1">Component: ${issue.component}</p>` : ''}
                    <p class="text-xs md:text-sm text-gray-700 mt-2 leading-relaxed">${solution}</p>
                    <div class="flex flex-wrap items-center mt-2 text-xs text-gray-500 gap-2">
                        <span>Time to fix: ${timeToFix}</span>
                        <span class="hidden sm:inline">•</span>
                        <span>Impact: ${impact}</span>
                        ${pointsGain ? `<span class="hidden sm:inline">•</span><span class="text-green-600">+${pointsGain} points</span>` : ''}
                    </div>
                </div>
            </div>
        `;
        criticalIssuesList.appendChild(div);
    });
}

/**
 * Display component scores breakdown
 */
function displayComponentScores(detailedAnalysis) {
    if (!componentScores || !detailedAnalysis || typeof detailedAnalysis !== 'object') return;
    
    componentScores.innerHTML = '';
    
    Object.entries(detailedAnalysis).forEach(([component, data]) => {
        if (data && typeof data === 'object' && data.score !== undefined) {
            const maxScore = getMaxScore(component);
            const percentage = Math.round((data.score / maxScore) * 100);
            const componentName = formatComponentName(component);
            
            const div = document.createElement('div');
            div.className = 'bg-white border border-gray-200 rounded-lg p-4';
            
            // Handle enhanced component data with letter grade
            const letterGrade = data.letter_grade || getComponentLetterGrade(percentage);
            const recommendations = data.recommendations || [];
            
            div.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-semibold text-gray-900">${componentName}</h4>
                    <div class="text-right">
                        <div class="flex items-center space-x-2">
                            <span class="text-lg font-bold ${getScoreColor(percentage)}">${data.score}</span>
                            <span class="text-sm text-gray-500">/${maxScore}</span>
                            <span class="text-sm font-bold ${getScoreColor(percentage)} bg-gray-100 px-2 py-1 rounded">${letterGrade}</span>
                        </div>
                        <div class="text-xs text-gray-500">${percentage}%</div>
                    </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div class="${getProgressBarColor(percentage)} h-2 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
                ${formatComponentDetails(data)}
                ${recommendations.length > 0 ? formatRecommendations(recommendations) : ''}
            `;
            componentScores.appendChild(div);
        }
    });
}

/**
 * Get letter grade for component score
 */
function getComponentLetterGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
}

/**
 * Format recommendations for component
 */
function formatRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) return '';
    
    const recList = recommendations.slice(0, 3).map(rec => `<li class="text-xs text-blue-700">• ${rec}</li>`).join('');
    return `
        <div class="mt-3 bg-blue-50 rounded p-2">
            <p class="text-xs font-medium text-blue-800 mb-1">Quick improvements:</p>
            <ul class="space-y-1">${recList}</ul>
        </div>
    `;
}

/**
 * Get progress bar color based on percentage
 */
function getProgressBarColor(percentage) {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
}

/**
 * Display before/after comparison
 */
function displayBeforeAfter(insights) {
    if (!beforeList || !afterList) return;
    
    beforeList.innerHTML = '';
    afterList.innerHTML = '';
    
    insights.beforeItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'flex items-center text-red-700';
        li.innerHTML = `
            <svg class="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            ${item}
        `;
        beforeList.appendChild(li);
    });
    
    insights.afterItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'flex items-center text-green-700';
        li.innerHTML = `
            <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            ${item}
        `;
        afterList.appendChild(li);
    });
}

/**
 * Update upgrade section with personalized data
 */
function updateUpgradeSection(insights) {
    if (totalIssuesCount) {
        totalIssuesCount.textContent = insights.totalIssues;
    }
    
    if (targetScore && analysisData) {
        // Use enhanced algorithm target if available
        const target = insights.interviewMetrics?.target_score || Math.min(analysisData.score + 40, 95);
        targetScore.textContent = target;
    }
    
    if (scoreImprovement && analysisData) {
        // Use enhanced algorithm improvement if available
        const improvement = insights.interviewMetrics?.score_improvement || Math.min(40, 95 - analysisData.score);
        scoreImprovement.textContent = `+${improvement}`;
    }
    
    if (estimatedTime) {
        // Use enhanced algorithm time estimate if available
        let timeEstimate;
        if (insights.transformationPreview && insights.transformationPreview.estimated_time) {
            timeEstimate = insights.transformationPreview.estimated_time;
        } else {
            timeEstimate = insights.totalIssues <= 3 ? '3 minutes' : insights.totalIssues <= 6 ? '5 minutes' : '7 minutes';
        }
        estimatedTime.textContent = timeEstimate;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 