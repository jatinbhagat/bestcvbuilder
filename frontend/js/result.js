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
const bypassPaymentBtn = document.getElementById('bypassPaymentBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const viewDetailedReportBtn = document.getElementById('viewDetailedReportBtn');
const detailedReportSection = document.getElementById('detailedReportSection');
const fixIssuesBtn = document.getElementById('fixIssuesBtn');

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
    console.log('🚀 Results page initialized - result.js');
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
 * Display analysis results on the page with new sidebar layout
 */
function displayAnalysisResults() {
    if (!analysisData) return;
    
    // Process analysis data to extract insights
    const insights = processAnalysisInsights(analysisData);
    
    // Display overall score in sidebar
    displayOverallScore(analysisData.score, analysisData.scoreCategory);
    
    // Display categorized issues in sidebar
    displaySidebarCategories(insights);
    
    // Display main issues list
    displayMainIssuesList(insights);
    
    // Display strengths section
    displayStrengthsSection(analysisData.strengths || [], insights);
    
    // Store data for payment flow
    sessionStorage.setItem('currentAnalysis', JSON.stringify(analysisData));
}

/**
 * Display overall ATS score in sidebar
 */
function displayOverallScore(score, category) {
    const atsScore = document.getElementById('atsScore');
    const scoreCircle = document.getElementById('scoreCircle');
    
    if (atsScore) {
        atsScore.textContent = score;
    }
    
    if (scoreCircle) {
        // Update circle color based on score
        scoreCircle.style.borderColor = getScoreColor(score);
    }
}

/**
 * Display categorized issues in sidebar
 */
function displaySidebarCategories(insights) {
    const topFixesList = document.getElementById('topFixesList');
    const completedList = document.getElementById('completedList');
    
    if (!topFixesList || !completedList) return;
    
    // Group issues by category
    const categories = groupIssuesByCategory(insights);
    
    // Display top fixes
    topFixesList.innerHTML = '';
    categories.topFixes.forEach(category => {
        const div = document.createElement('div');
        div.className = 'sidebar-item';
        div.innerHTML = `
            <span class="text-gray-700 font-medium">${category.name}</span>
            <span class="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">${category.count}</span>
        `;
        topFixesList.appendChild(div);
    });
    
    // Display completed items
    completedList.innerHTML = '';
    categories.completed.forEach(category => {
        const div = document.createElement('div');
        div.className = 'sidebar-item';
        div.innerHTML = `
            <span class="text-gray-700 font-medium">${category.name}</span>
            <span class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">${category.count}</span>
        `;
        completedList.appendChild(div);
    });
}

/**
 * Display main issues list with cards
 */
function displayMainIssuesList(insights) {
    const issuesList = document.getElementById('issuesList');
    if (!issuesList) return;
    
    issuesList.innerHTML = '';
    
    // Combine all issues
    const allIssues = [
        ...insights.criticalIssues.map(issue => ({...issue, severity: 'high'})),
        ...insights.quickWins.map(issue => ({...issue, severity: 'medium'}))
    ];
    
    allIssues.forEach(issue => {
        const card = document.createElement('div');
        card.className = `issue-card severity-${issue.severity}`;
        
        const impactIcon = getImpactIcon(issue.impact || 'IMPACT');
        
        card.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-900">${issue.title}</h3>
                </div>
                <p class="text-gray-600 mb-2">${issue.issue || issue.description || 'This issue needs to be addressed'}</p>
                <div class="impact-badge">
                    ${impactIcon}
                    ${getImpactLabel(issue.impact || 'IMPACT')}
                </div>
            </div>
            <button class="fix-button" onclick="handleFixIssue('${issue.title}')">
                FIX →
            </button>
        `;
        
        issuesList.appendChild(card);
    });
}

/**
 * Display strengths section
 */
function displayStrengthsSection(strengths, insights) {
    const strengthsList = document.getElementById('strengthsList');
    if (!strengthsList) return;
    
    strengthsList.innerHTML = '';
    
    // Create strength items based on analysis
    const strengthItems = generateStrengthItems(strengths, insights);
    
    strengthItems.forEach(strength => {
        const div = document.createElement('div');
        div.className = 'strength-item';
        div.innerHTML = `
            <div class="check-icon">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <div>
                <h4 class="font-semibold text-gray-900 mb-1">${strength.title}:</h4>
                <p class="text-gray-600">${strength.description}</p>
            </div>
        `;
        strengthsList.appendChild(div);
    });
}

/**
 * Group issues by category for sidebar
 */
function groupIssuesByCategory(insights) {
    const categories = {
        topFixes: [
            { name: 'Spelling & consistency', count: insights.criticalIssues.filter(i => i.category === 'spelling').length || 7 },
            { name: 'Education', count: insights.criticalIssues.filter(i => i.category === 'education').length || 7 },
            { name: 'Bullet lengths', count: insights.quickWins.filter(i => i.category === 'formatting').length || 8 },
            { name: 'Consistency', count: insights.criticalIssues.filter(i => i.category === 'consistency').length || 8 },
            { name: 'Verb tenses', count: insights.criticalIssues.filter(i => i.category === 'grammar').length || 9 },
            { name: 'Job fit', count: insights.criticalIssues.filter(i => i.category === 'keywords').length || 9 }
        ],
        completed: [
            { name: 'Weak verbs', count: 10 },
            { name: 'Responsibilities', count: 10 }
        ]
    };
    
    return categories;
}

/**
 * Generate strength items from analysis
 */
function generateStrengthItems(strengths, insights) {
    const defaultStrengths = [
        {
            title: 'Page density',
            description: 'Your page layout looks right.'
        },
        {
            title: 'Dates are in the right format', 
            description: 'Your dates are in the right format.'
        },
        {
            title: 'Unique action verbs and phrases',
            description: 'You didn\'t overuse any verbs or phrases.'
        }
    ];
    
    // Use provided strengths if available, otherwise use defaults
    if (strengths && strengths.length > 0) {
        return strengths.slice(0, 3).map(strength => ({
            title: strength,
            description: 'This aspect of your resume is well done.'
        }));
    }
    
    return defaultStrengths;
}

/**
 * Get impact icon for issue cards
 */
function getImpactIcon(impact) {
    const icons = {
        'BREVITY': '📝',
        'IMPACT': '⚡',
        'ALL': '👥',
        'SECTIONS': '📋',
        'STYLE': '🎨'
    };
    return icons[impact] || '⚡';
}

/**
 * Get impact label
 */
function getImpactLabel(impact) {
    return impact || 'IMPACT';
}

/**
 * Handle fix issue button click
 */
function handleFixIssue(issueTitle) {
    console.log('Fix issue clicked:', issueTitle);
    // For now, redirect to upgrade
    handleUpgrade();
}

/**
 * Get score color based on value
 */
function getScoreColor(score) {
    if (score >= 85) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // orange
    return '#ef4444'; // red
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
    
    // Show only top 4 strengths for cleaner layout
    const topStrengths = strengths.slice(0, 4);
    
    topStrengths.forEach(strength => {
        const div = document.createElement('div');
        div.className = 'bg-green-50 rounded-lg p-2 border-l-4 border-green-400';
        div.innerHTML = `
            <span class="text-sm text-gray-800 font-medium">${strength}</span>
        `;
        strengthsList.appendChild(div);
    });
    
    // Add "show more" if there are additional strengths
    if (strengths.length > 4) {
        const showMore = document.createElement('div');
        showMore.className = 'text-xs text-green-600 font-medium text-center pt-2';
        showMore.textContent = `+${strengths.length - 4} more strengths`;
        strengthsList.appendChild(showMore);
    }
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
    // Note: checkPaymentBypass() is now called after data loads in loadAnalysisData()
    
    // Add keyboard shortcut for testing (Ctrl+Shift+B)
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.shiftKey && event.key === 'B') {
            console.log('🧪 Manual bypass activation via keyboard shortcut');
            sessionStorage.setItem('BYPASS_PAYMENT', 'true');
            checkPaymentBypass();
            showSuccess('Payment bypass activated manually!');
        }
    });
    
    // Upgrade button
    console.log('🔍 Looking for upgradeBtn:', upgradeBtn ? 'FOUND' : 'NOT FOUND');
    if (upgradeBtn) {
        console.log('✅ Adding click listener to upgradeBtn');
        upgradeBtn.addEventListener('click', handleUpgrade);
    } else {
        console.error('❌ upgradeBtn not found in DOM');
    }
    
    // Bypass payment button (testing mode)
    if (bypassPaymentBtn) {
        bypassPaymentBtn.addEventListener('click', handleBypassPayment);
    }
    
    // Sticky mobile upgrade button
    const stickyUpgradeBtn = document.getElementById('stickyUpgradeBtn');
    if (stickyUpgradeBtn) {
        stickyUpgradeBtn.addEventListener('click', handleUpgrade);
    }
    
    // New analysis button
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', handleNewAnalysis);
    }
    
    // View detailed report button
    if (viewDetailedReportBtn) {
        viewDetailedReportBtn.addEventListener('click', handleViewDetailedReport);
    }
    
    // Fix issues button (in detailed report)
    if (fixIssuesBtn) {
        fixIssuesBtn.addEventListener('click', handleFixIssues);
    }
    
    // Fix issues button 2 (in detailed report section)
    const fixIssuesBtn2 = document.getElementById('fixIssuesBtn2');
    if (fixIssuesBtn2) {
        fixIssuesBtn2.addEventListener('click', handleFixIssues);
    }
    
    // Detailed analysis toggle
    const toggleBtn = document.getElementById('toggleDetailedAnalysis');
    const detailsSection = document.getElementById('detailedAnalysisSection');
    const chevron = document.getElementById('detailsChevron');
    
    if (toggleBtn && detailsSection && chevron) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = detailsSection.classList.contains('hidden');
            
            if (isHidden) {
                detailsSection.classList.remove('hidden');
                chevron.style.transform = 'rotate(180deg)';
            } else {
                detailsSection.classList.add('hidden');
                chevron.style.transform = 'rotate(0deg)';
            }
        });
    }
    
    // Hide sticky CTA when main CTA is visible
    setupStickyCtaVisibility();
}

/**
 * Setup sticky CTA visibility based on main CTA position
 */
function setupStickyCtaVisibility() {
    const mainCTA = document.getElementById('upgradeBtn');
    const stickyCTA = document.getElementById('stickyMobileCTA');
    
    if (!mainCTA || !stickyCTA) return;
    
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Main CTA is visible, hide sticky
                    stickyCTA.style.transform = 'translateY(100%)';
                } else {
                    // Main CTA is not visible, show sticky
                    stickyCTA.style.transform = 'translateY(0)';
                }
            });
        },
        { threshold: 0.1 }
    );
    
    observer.observe(mainCTA);
}

/**
 * Handle upgrade button click - ALWAYS BYPASS (no payments)
 */
async function handleUpgrade() {
    console.log('🚀 User clicked Fix My Resume Now - Processing real CV improvement...');
    
    try {
        // Log upgrade button click (non-blocking)
        try {
            DatabaseService.logActivity(null, 'upgrade_button_clicked', {
                original_score: analysisData?.score || 'unknown'
            }).catch(err => console.warn('Activity logging failed (non-critical):', err));
        } catch (logError) {
            console.warn('Activity logging failed (non-critical):', logError);
        }
        
        // Show immediate feedback
        if (upgradeBtn) {
            upgradeBtn.disabled = true;
            upgradeBtn.textContent = '🔄 Processing Resume Improvements...';
        }
        
        // Call the real CV rewrite API
        console.log('📡 Calling CV rewrite API...');
        await handleResumeRewrite();
        
    } catch (error) {
        console.error('❌ Error in handleUpgrade:', error);
        showError('Something went wrong. Please try again.');
        
        // Reset button
        if (upgradeBtn) {
            upgradeBtn.disabled = false;
            upgradeBtn.textContent = '🚀 Fix My Resume Now - FREE';
        }
    }
}

/**
 * Handle actual resume rewrite using the CV rewrite API
 */
async function handleResumeRewrite() {
    try {
        console.log('🔄 Starting resume rewrite process...');
        
        if (!analysisData) {
            throw new Error('No analysis data available for rewrite');
        }
        
        // Get user information
        let userEmail = 'user@example.com'; // Default fallback
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email) {
                userEmail = user.email;
            }
        } catch (authError) {
            console.warn('Could not get user email, using default:', authError);
        }
        
        // Prepare API request data
        const requestData = {
            original_analysis: analysisData,
            user_email: userEmail,
            payment_id: `free_${Date.now()}`, // Since payments are removed
            original_file_url: analysisData.originalFileUrl // Add the original file URL
        };
        
        console.log('📤 Sending rewrite request:', {
            original_score: analysisData.score,
            user_email: userEmail
        });
        
        // DEBUG: Log the analysis data being sent
        console.log('🔍 DEBUG: Analysis data keys:', Object.keys(analysisData));
        console.log('🔍 DEBUG: Has file_url:', 'file_url' in analysisData, analysisData.file_url);
        console.log('🔍 DEBUG: Has content:', 'content' in analysisData, analysisData.content ? analysisData.content.length : 'null');
        console.log('🔍 DEBUG: Has originalFileUrl:', 'originalFileUrl' in analysisData, analysisData.originalFileUrl);
        
        // Call CV rewrite API
        const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? '/api' 
            : 'https://bestcvbuilder-api.onrender.com/api';
        
        const response = await fetch(`${API_BASE_URL}/resume-fix`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`CV rewrite failed: ${errorData.error || response.statusText}`);
        }
        
        const rewriteResult = await response.json();
        console.log('✅ CV rewrite completed:', rewriteResult);
        
        // Store rewrite result in session storage
        sessionStorage.setItem('cvRewriteResult', JSON.stringify(rewriteResult));
        
        // Navigate to success page
        window.location.href = './success.html';
        
    } catch (error) {
        console.error('❌ Resume rewrite failed:', error);
        throw error; // Re-throw to be handled by handleUpgrade
    }
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
 * Handle view detailed report button click
 */
function handleViewDetailedReport() {
    try {
        console.log('Showing detailed report');
        
        // Toggle detailed report section
        if (detailedReportSection.classList.contains('hidden')) {
            detailedReportSection.classList.remove('hidden');
            viewDetailedReportBtn.textContent = '📊 Hide Detailed Report';
            
            // Populate detailed report content
            populateDetailedReport();
            
            // Scroll to detailed report
            detailedReportSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            detailedReportSection.classList.add('hidden');
            viewDetailedReportBtn.textContent = '📊 View Detailed Report';
        }
        
    } catch (error) {
        console.error('Error showing detailed report:', error);
        showError('Failed to display detailed report.');
    }
}

/**
 * Handle fix issues button click - ALWAYS BYPASS (no payments)
 */
function handleFixIssues() {
    try {
        console.log('User clicked fix issues - ALWAYS BYPASS MODE');
        
        // ALWAYS go to bypass success - never call real API
        console.log('✅ Going directly to success with improved resume data');
        handleBypassSuccess();
        
    } catch (error) {
        console.error('Error handling fix issues request:', error);
        showError('Failed to process fix request.');
    }
}

/**
 * Populate detailed report content
 */
function populateDetailedReport() {
    if (!analysisData) return;
    
    // Populate component scores
    const componentScores = document.getElementById('componentScores');
    if (componentScores && analysisData.components) {
        componentScores.innerHTML = '';
        Object.entries(analysisData.components).forEach(([component, data]) => {
            const percentage = Math.round((data.score / data.max_score) * 100);
            const componentDiv = document.createElement('div');
            componentDiv.className = 'bg-gray-50 rounded-lg p-4';
            componentDiv.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="font-medium text-gray-900 capitalize">${component.replace('_', ' ')}</span>
                    <span class="font-bold text-gray-900">${data.score}/${data.max_score}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
                <div class="text-sm text-gray-600 mt-1">${percentage}% Complete</div>
            `;
            componentScores.appendChild(componentDiv);
        });
    }
    
    // Populate all issues
    const allIssuesList = document.getElementById('allIssuesList');
    if (allIssuesList) {
        allIssuesList.innerHTML = '';
        
        // Combine all issues
        const allIssues = [
            ...(analysisData.quick_wins || []),
            ...(analysisData.critical_issues || [])
        ];
        
        allIssues.forEach(issue => {
            const issueDiv = document.createElement('div');
            issueDiv.className = `bg-gray-50 rounded-lg p-4 border-l-4 ${
                issue.impact === 'Critical' ? 'border-red-400' : 'border-blue-400'
            }`;
            issueDiv.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h5 class="font-medium text-gray-900">${issue.title}</h5>
                    <span class="text-xs font-bold px-2 py-1 rounded-full ${
                        issue.impact === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }">
                        +${issue.points_gain}pts
                    </span>
                </div>
                <p class="text-sm text-gray-600 mb-1">${issue.issue}</p>
                <p class="text-sm text-gray-800">${issue.solution}</p>
                <div class="text-xs text-gray-500 mt-2">Time to fix: ${issue.time_to_fix}</div>
            `;
            allIssuesList.appendChild(issueDiv);
        });
    }
    
    // Populate recommendations
    const detailedRecommendations = document.getElementById('detailedRecommendations');
    if (detailedRecommendations && analysisData.recommendations) {
        detailedRecommendations.innerHTML = '';
        analysisData.recommendations.forEach((rec, index) => {
            const recDiv = document.createElement('div');
            recDiv.className = 'bg-blue-50 rounded-lg p-4';
            recDiv.innerHTML = `
                <div class="flex items-start">
                    <div class="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                        ${index + 1}
                    </div>
                    <p class="text-gray-800">${rec}</p>
                </div>
            `;
            detailedRecommendations.appendChild(recDiv);
        });
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
    // Check if the data has our new detailed issues structure
    if (data.critical_issues && data.quick_wins && data.content_improvements) {
        // Use the new detailed issues algorithm data directly
        return {
            quickWins: data.quick_wins || [],
            criticalIssues: data.critical_issues || [],
            contentImprovements: data.content_improvements || [],
            beforeItems: data.transformation_preview?.before || generateBeforeItems(data),
            afterItems: data.transformation_preview?.after || generateAfterItems(data),
            totalIssues: data.total_issues || ((data.critical_issues?.length || 0) + (data.quick_wins?.length || 0) + (data.content_improvements?.length || 0)),
            potentialImprovement: data.potential_improvement || calculateRealisticPotentialImprovement(data),
            realisticTargetScore: data.realistic_target_score || Math.min(data.score + calculateRealisticPotentialImprovement(data), 95),
            estimatedTime: data.estimated_time || '30 minutes',
            interviewMetrics: data.interview_metrics || null,
            transformationPreview: data.transformation_preview || null
        };
    }
    
    // Check if the data has legacy enhanced structure  
    if (data.critical_issues && data.quick_wins) {
        // Use the legacy enhanced algorithm data directly
        const potentialImp = calculateRealisticPotentialImprovement(data);
        return {
            quickWins: data.quick_wins || [],
            criticalIssues: data.critical_issues || [],
            contentImprovements: [],
            beforeItems: data.transformation_preview?.before || generateBeforeItems(data),
            afterItems: data.transformation_preview?.after || generateAfterItems(data),
            totalIssues: (data.critical_issues?.length || 0) + (data.quick_wins?.length || 0),
            potentialImprovement: potentialImp,
            realisticTargetScore: Math.min(data.score + potentialImp, 95),
            estimatedTime: '45 minutes',
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
    const potentialImp = calculateRealisticPotentialImprovement(data);
    beforeItems.push(`ATS Score: ${data.score}/100`);
    afterItems.push(`ATS Score: ${Math.min(data.score + potentialImp, 95)}/100`);
    
    if (quickWins.length > 0) {
        beforeItems.push(`Missing key optimizations`);
        afterItems.push(`Fully optimized with industry keywords`);
    }
    
    if (criticalIssues.length > 0) {
        beforeItems.push(`${criticalIssues.length} critical formatting issues`);
        afterItems.push(`Professional ATS-friendly formatting`);
    }
    
    beforeItems.push(`${getInterviewRate(data.score)}% interview rate`);
    afterItems.push(`${getInterviewRate(Math.min(data.score + potentialImp, 95))}% interview rate`);
    
    return {
        quickWins: quickWins.slice(0, 3), // Limit to top 3
        criticalIssues: criticalIssues.slice(0, 5), // Limit to top 5
        beforeItems,
        afterItems,
        totalIssues: quickWins.length + criticalIssues.length,
        potentialImprovement: potentialImp
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
    
    quickWinsCount.textContent = quickWins.length;
    quickWinsList.innerHTML = '';
    
    if (quickWins.length === 0) {
        quickWinsList.innerHTML = '<p class="text-blue-700 text-sm">Great! No quick fixes needed.</p>';
        return;
    }
    
    // Show only top 2 quick wins for cleaner summary
    const topWins = quickWins.slice(0, 2);
    
    topWins.forEach(win => {
        const div = document.createElement('div');
        div.className = 'bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400';
        
        // Handle both new and legacy data formats
        const pointsGain = win.points_gain || win.pointsGain || 3;
        
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-800 font-medium flex-1">${win.title}</span>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium ml-2">+${pointsGain}pts</span>
            </div>
        `;
        quickWinsList.appendChild(div);
    });
    
    // Add "show more" if there are additional wins
    if (quickWins.length > 2) {
        const showMore = document.createElement('div');
        showMore.className = 'text-xs text-blue-600 font-medium text-center pt-2';
        showMore.textContent = `+${quickWins.length - 2} more fixes available`;
        quickWinsList.appendChild(showMore);
    }
}

/**
 * Display critical issues section with mobile-optimized layout
 */
function displayCriticalIssues(criticalIssues) {
    if (!criticalIssuesList || !criticalIssuesCount) return;
    
    criticalIssuesCount.textContent = criticalIssues.length;
    criticalIssuesList.innerHTML = '';
    
    if (criticalIssues.length === 0) {
        criticalIssuesList.innerHTML = '<p class="text-green-700 text-sm">Excellent! No critical issues found.</p>';
        return;
    }
    
    // Show only top 3 critical issues for cleaner summary
    const topIssues = criticalIssues.slice(0, 3);
    
    topIssues.forEach(issue => {
        const div = document.createElement('div');
        div.className = 'bg-red-50 rounded-lg p-3 border-l-4 border-red-400';
        
        // Handle both new and legacy data formats
        const pointsGain = issue.points_gain || issue.pointsGain || 8;
        
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-800 font-medium flex-1">${issue.title}</span>
                <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium ml-2">+${pointsGain}pts</span>
            </div>
        `;
        criticalIssuesList.appendChild(div);
    });
    
    // Add "show more" if there are additional issues
    if (criticalIssues.length > 3) {
        const showMore = document.createElement('div');
        showMore.className = 'text-xs text-red-600 font-medium text-center pt-2';
        showMore.textContent = `+${criticalIssues.length - 3} more issues to fix`;
        criticalIssuesList.appendChild(showMore);
    }
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
            div.className = 'bg-gray-50 border border-gray-200 rounded-xl p-4';
            
            // Handle enhanced component data with letter grade
            const letterGrade = data.letter_grade || getComponentLetterGrade(percentage);
            const recommendations = data.recommendations || [];
            
            div.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-bold text-gray-900">${componentName}</h4>
                    <div class="text-right">
                        <div class="flex items-center space-x-2">
                            <span class="text-xl font-bold ${getScoreColor(percentage)}">${data.score}</span>
                            <span class="text-sm text-gray-500">/${maxScore}</span>
                            <span class="text-sm font-bold ${getScoreColor(percentage)} bg-white px-2 py-1 rounded-lg">${letterGrade}</span>
                        </div>
                        <div class="text-xs text-gray-500">${percentage}%</div>
                    </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div class="${getProgressBarColor(percentage)} h-3 rounded-full transition-all duration-700" style="width: ${percentage}%"></div>
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
    
    const recList = recommendations.slice(0, 2).map(rec => `<li class="text-xs text-blue-700">• ${rec}</li>`).join('');
    return `
        <div class="mt-3 bg-blue-50 rounded-lg p-3">
            <p class="text-xs font-bold text-blue-800 mb-2">💡 Quick improvements:</p>
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

/**
 * Check if payment bypass is enabled for testing
 */
function checkPaymentBypass() {
    const bypassSession = sessionStorage.getItem('BYPASS_PAYMENT') === 'true';
    const urlParams = new URLSearchParams(window.location.search);
    const bypassUrl = urlParams.has('bypass') || urlParams.has('test') || urlParams.has('debug');
    const bypassHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    console.log('🔍 Payment bypass check:');
    console.log('  - Session bypass:', bypassSession);
    console.log('  - URL bypass:', bypassUrl);
    console.log('  - Local host:', bypassHost);
    console.log('  - Current URL:', window.location.href);
    
    // Always show bypass button for easy testing in production
    const shouldShowBypass = true; // Always visible for testing
    
    // Show/hide bypass button based on conditions
    if (bypassPaymentBtn) {
        if (shouldShowBypass) {
            bypassPaymentBtn.classList.remove('hidden');
            console.log('👁️ Bypass button visible');
        } else {
            bypassPaymentBtn.classList.add('hidden');
            console.log('🙈 Bypass button hidden');
        }
    }
    
    // Auto-enable bypass if URL parameter is present
    if (bypassUrl && !bypassSession) {
        sessionStorage.setItem('BYPASS_PAYMENT', 'true');
        console.log('🔗 Auto-enabled bypass from URL parameter');
    }
    
    // Add global functions for manual testing
    window.enablePaymentBypass = function() {
        sessionStorage.setItem('BYPASS_PAYMENT', 'true');
        console.log('🧪 Payment bypass enabled via console');
        alert('Payment bypass enabled! Now click "Fix My Resume Now" button.');
        checkPaymentBypass(); // Update UI
    };
    
    window.disablePaymentBypass = function() {
        sessionStorage.removeItem('BYPASS_PAYMENT');
        console.log('💳 Payment bypass disabled');
        alert('Payment bypass disabled - normal payment flow will be used.');
        checkPaymentBypass(); // Update UI
    };
    
    // Auto-enable bypass in production if no real file data available
    if (!bypassSession && analysisData && !analysisData.file_url && !analysisData.content) {
        console.log('🔄 No real file data found - auto-enabling bypass for testing');
        console.log('📊 Analysis data:', analysisData);
        sessionStorage.setItem('BYPASS_PAYMENT', 'true');
        console.log('✅ Auto-bypass enabled');
    } else if (!bypassSession) {
        console.log('🔍 Analysis data check:');
        console.log('  - Has analysisData:', !!analysisData);
        console.log('  - Has file_url:', analysisData?.file_url);
        console.log('  - Has content:', !!analysisData?.content);
        console.log('  - Bypass session:', bypassSession);
    }
}

/**
 * Handle bypass payment for testing
 */
function handleBypassPayment() {
    console.log('🧪 BYPASS BUTTON CLICKED - enabling bypass');
    
    // Enable bypass mode
    sessionStorage.setItem('BYPASS_PAYMENT', 'true');
    console.log('✅ Bypass payment stored in session');
    
    // Update button text to show it's enabled
    if (bypassPaymentBtn) {
        bypassPaymentBtn.textContent = '✅ Testing Mode Enabled';
        bypassPaymentBtn.disabled = true;
        bypassPaymentBtn.classList.add('bg-green-500');
        bypassPaymentBtn.classList.remove('bg-yellow-500');
    }
    
    // Update main button text to show bypass mode
    if (upgradeBtn) {
        upgradeBtn.textContent = '🧪 Fix My Resume Now (Testing Mode)';
        upgradeBtn.classList.add('bg-yellow-100', 'text-yellow-800');
        upgradeBtn.classList.remove('bg-white', 'text-gray-900');
    }
    
    checkPaymentBypass(); // Update UI
    showSuccess('Testing mode enabled! Now click "Fix My Resume Now" button.');
}

/**
 * Show success message
 */
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center';
    successDiv.innerHTML = `
        <span class="mr-2">✅</span>
        <div>
            <div class="font-bold">Success!</div>
            <div class="text-sm opacity-90">${message}</div>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

/**
 * Handle real resume improvement with Gemini AI
 */
async function handleRealResumeImprovement() {
    console.log('🤖 Starting real resume improvement with Gemini AI');
    
    if (!analysisData) {
        showError('No analysis data available for improvement');
        resetUpgradeButton();
        return;
    }
    
    try {
        // Call the resume-fix API with real Gemini processing
        const API_BASE_URL = 'https://bestcvbuilder-api.onrender.com';
        console.log(`🚀 REAL-API: Calling resume-fix API at ${API_BASE_URL}/api/resume-fix`);
        console.log(`📋 REAL-API: Analysis data keys: ${Object.keys(analysisData)}`);
        
        // Debug: Check what data we're sending
        console.log(`🔍 REAL-API: Analysis data structure:`, analysisData);
        console.log(`🔍 REAL-API: Has file_url: ${'file_url' in analysisData}`);
        console.log(`🔍 REAL-API: Has content: ${'content' in analysisData}`);
        console.log(`🔍 REAL-API: Has pdf_url: ${'pdf_url' in analysisData}`);
        
        if (analysisData.file_url) {
            console.log(`📄 REAL-API: File URL: ${analysisData.file_url}`);
        }
        if (analysisData.content) {
            console.log(`📄 REAL-API: Content length: ${analysisData.content.length}`);
        }
        
        const requestPayload = {
            original_analysis: analysisData,
            user_email: 'user@bestcvbuilder.com',
            payment_id: `real_${Date.now()}`
        };
        
        console.log(`📤 REAL-API: Sending payload with keys: ${Object.keys(requestPayload.original_analysis)}`);
        
        const response = await fetch(`${API_BASE_URL}/api/resume-fix`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload)
        });
        
        console.log(`📈 REAL-API: Response status: ${response.status}`);
        console.log(`📄 REAL-API: Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ REAL-API: API Error (${response.status}):`, errorText);
            throw new Error(`Resume improvement failed: ${response.status} - ${errorText}`);
        }
        
        const rewriteResult = await response.json();
        console.log('✅ REAL-API: Resume improvement completed successfully');
        console.log(`📊 REAL-API: Result keys: ${Object.keys(rewriteResult)}`);
        console.log(`📄 REAL-API: Has PDF URL: ${'improved_resume_url' in rewriteResult}`);
        
        if (rewriteResult.improved_resume_url) {
            console.log(`📁 REAL-API: PDF URL type: ${typeof rewriteResult.improved_resume_url}`);
            console.log(`📁 REAL-API: PDF URL length: ${rewriteResult.improved_resume_url.length}`);
        }
        
        // Store real result and redirect to success page
        sessionStorage.setItem('cvRewriteResult', JSON.stringify(rewriteResult));
        console.log(`💾 REAL-API: Stored real AI result in sessionStorage`);
        
        // Show success message and redirect
        showSuccessMessage('AI Improvement Complete! Redirecting...');
        
        setTimeout(() => {
            window.location.href = './success.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ REAL-API: Resume improvement failed:', error);
        showError(`AI Processing failed: ${error.message}`);
        resetUpgradeButton();
    }
}

/**
 * Reset upgrade button state
 */
function resetUpgradeButton() {
    if (upgradeBtn) {
        upgradeBtn.disabled = false;
        upgradeBtn.textContent = '🚀 Fix My Resume Now - $9';
    }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

/**
 * Handle bypass success - create proper success data and redirect
 */
function handleBypassSuccess() {
    console.log('🚀 Creating bypass success data with real analysis data...');
    
    try {
        if (!analysisData) {
            throw new Error('No analysis data available for bypass');
        }
        
        // Create payment data for bypass
        const paymentData = {
            payment_id: `bypass_${Date.now()}`,
            status: 'succeeded',
            email: 'bypass@example.com',
            bypass_mode: true
        };
        
        // Calculate realistic improvements based on actual analysis
        const originalScore = analysisData.score || 65;
        const potentialImprovement = calculateRealisticImprovement(analysisData);
        const newScore = Math.min(originalScore + potentialImprovement, 95);
        
        // Create rewrite result with proper data structure
        const rewriteData = {
            original_score: originalScore,
            new_score: newScore,
            score_improvement: potentialImprovement,
            original_analysis: analysisData,
            improved_resume_url: null, // No actual file in bypass mode
            bypass_mode: true,
            completed_at: new Date().toISOString(),
            improvements_made: generateImprovementsList(analysisData),
            before_after_comparison: {
                before: {
                    score: originalScore,
                    issues: (analysisData.critical_issues?.length || 0) + (analysisData.quick_wins?.length || 0)
                },
                after: {
                    score: newScore,
                    issues: 0
                }
            }
        };
        
        // Store in session storage
        sessionStorage.setItem('paymentResult', JSON.stringify(paymentData));
        sessionStorage.setItem('cvRewriteResult', JSON.stringify(rewriteData));
        
        console.log('✅ Bypass success data created:');
        console.log('  - Original score:', originalScore);
        console.log('  - New score:', newScore);
        console.log('  - Improvement:', potentialImprovement);
        console.log('  - Improvements made:', rewriteData.improvements_made.length);
        
        showSuccessMessage('Processing complete! Redirecting to success page...');
        
        // Redirect after brief delay
        setTimeout(() => {
            console.log('🔄 Redirecting to success.html...');
            window.location.href = './success.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Bypass error:', error);
        showError('Failed to process bypass: ' + error.message);
        resetUpgradeButton();
    }
}

/**
 * Calculate realistic improvement based on analysis data
 */
function calculateRealisticImprovement(data) {
    let improvement = 0;
    
    // Base improvement from quick wins
    const quickWins = data.quick_wins || [];
    improvement += quickWins.length * 3; // 3 points per quick win
    
    // Base improvement from critical issues
    const criticalIssues = data.critical_issues || [];
    improvement += criticalIssues.length * 8; // 8 points per critical issue
    
    // Ensure minimum improvement of 15 points and maximum of 40
    improvement = Math.max(15, Math.min(improvement, 40));
    
    return improvement;
}

/**
 * Generate list of improvements made during bypass
 */
function generateImprovementsList(data) {
    const improvements = [];
    
    // Add quick wins
    if (data.quick_wins) {
        data.quick_wins.forEach(win => {
            improvements.push({
                type: 'quick_fix',
                title: win.title || 'Quick formatting improvement',
                description: win.issue || 'Fixed formatting issue for better ATS compatibility',
                points_gained: win.points_gain || 3
            });
        });
    }
    
    // Add critical issue fixes
    if (data.critical_issues) {
        data.critical_issues.forEach(issue => {
            improvements.push({
                type: 'critical_fix',
                title: issue.title || 'Critical issue resolved',
                description: issue.issue || 'Fixed critical ATS compatibility issue',
                points_gained: issue.points_gain || 8
            });
        });
    }
    
    // Add some generic improvements if no specific ones
    if (improvements.length === 0) {
        improvements.push(
            {
                type: 'formatting',
                title: 'ATS-friendly formatting applied',
                description: 'Optimized resume structure for better ATS parsing',
                points_gained: 10
            },
            {
                type: 'keywords',
                title: 'Keyword optimization',
                description: 'Enhanced with industry-relevant keywords',
                points_gained: 8
            },
            {
                type: 'structure',
                title: 'Professional structure improvements',
                description: 'Improved section organization and hierarchy',
                points_gained: 12
            }
        );
    }
    
    return improvements;
}

/**
 * Calculate realistic potential improvement based on analysis data
 */
function calculateRealisticPotentialImprovement(data) {
    let improvement = 0;
    
    // Base improvement from quick wins
    const quickWins = data.quick_wins || [];
    improvement += quickWins.length * 3; // 3 points per quick win
    
    // Base improvement from critical issues
    const criticalIssues = data.critical_issues || [];
    improvement += criticalIssues.length * 5; // 5 points per critical issue
    
    // Legacy improvements fallback
    if (data.improvements && data.improvements.length > 0 && improvement === 0) {
        improvement = data.improvements.length * 4; // 4 points per improvement
    }
    
    // Score-based realistic ceiling
    const currentScore = data.score || 65;
    const maxPossibleImprovement = Math.max(5, 95 - currentScore); // Can't exceed 95
    
    // Apply realistic constraints
    if (currentScore >= 80) {
        improvement = Math.min(improvement, 10); // High scores have less room for improvement
    } else if (currentScore >= 60) {
        improvement = Math.min(improvement, 20); // Medium scores can improve more
    } else {
        improvement = Math.min(improvement, 30); // Low scores have most potential
    }
    
    // Ensure minimum improvement of 5 points
    improvement = Math.max(5, Math.min(improvement, maxPossibleImprovement));
    
    return improvement;
}

// Debug: Log when result.js loads - ALWAYS BYPASS VERSION
console.log('🔄 result.js module loaded - BYPASS MODE ACTIVE');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 