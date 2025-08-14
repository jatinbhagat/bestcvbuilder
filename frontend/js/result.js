/**
 * Results page JavaScript for displaying ATS analysis results
 * Handles score display, upgrade flow, and user interactions
 * Updated with sidebar layout to match screenshot design
 */

import { supabase, DatabaseService } from './supabase.js';
import { getScoreDescription, getImprovementSuggestions, calculatePotentialImprovement } from './atsAnalysis.js';

// DOM Elements - Enhanced for new sidebar UI
const atsScore = document.getElementById('atsScore');
const scoreCircle = document.getElementById('scoreCircle');
const markedAsDone = document.getElementById('markedAsDone');
const topFixesList = document.getElementById('topFixesList');
const completedList = document.getElementById('completedList');
const issuesList = document.getElementById('issuesList');
const strengthsList = document.getElementById('strengthsList');
const strengthsSection = document.getElementById('strengthsSection');
const upgradeBtn = document.getElementById('upgradeBtn');

// Analysis data from session storage
let analysisData = null;
let allIssues = [];

/**
 * Initialize the results page with new sidebar design
 */
function init() {
    try {
        // Load analysis data from session storage
        const storedData = sessionStorage.getItem('atsAnalysisResult');
        if (!storedData) {
            console.error('No analysis data found in session storage');
            window.location.href = './index.html';
            return;
        }

        analysisData = JSON.parse(storedData);
        console.log('Analysis data loaded:', analysisData);

        // Display results in new sidebar format
        displayOverallScore(analysisData);
        displaySidebarCategories(analysisData);
        displayMainIssuesList(analysisData);
        displayStrengths(analysisData);
        
        setupEventHandlers();

    } catch (error) {
        console.error('Error initializing results page:', error);
        // Fallback to home page if there's an error
        setTimeout(() => {
            window.location.href = './index.html';
        }, 3000);
    }
}

/**
 * Display overall ATS score in the sidebar circle
 */
function displayOverallScore(data) {
    if (!atsScore) return;
    
    const score = data.insights?.overall_score || data.overall_score || 75;
    atsScore.textContent = Math.round(score);
    
    // Update circle color based on score
    if (scoreCircle) {
        if (score >= 80) {
            scoreCircle.style.borderColor = '#10b981'; // Green
        } else if (score >= 60) {
            scoreCircle.style.borderColor = '#f59e0b'; // Orange
        } else {
            scoreCircle.style.borderColor = '#ef4444'; // Red
        }
    }
}

/**
 * Display categorized issues in the sidebar
 */
function displaySidebarCategories(data) {
    if (!topFixesList) return;
    
    const insights = data.insights || {};
    allIssues = [];
    
    // Collect all issues from different categories
    const quickWins = insights.quick_wins || [];
    const criticalIssues = insights.critical_issues || [];
    const improvementSuggestions = insights.improvement_suggestions || [];
    
    // Add issues with categories
    quickWins.forEach(issue => {
        allIssues.push({
            ...issue,
            category: 'Quick Wins',
            severity: 'medium',
            impact: getImpactFromIssue(issue)
        });
    });
    
    criticalIssues.forEach(issue => {
        allIssues.push({
            ...issue,
            category: 'Critical Issues',
            severity: 'high',
            impact: getImpactFromIssue(issue)
        });
    });
    
    improvementSuggestions.forEach(issue => {
        allIssues.push({
            ...issue,
            category: 'Improvements',
            severity: 'low',
            impact: getImpactFromIssue(issue)
        });
    });

    // Group by category for sidebar
    const categories = {
        'Spelling & consistency': allIssues.filter(i => i.impact === 'BREVITY' || i.title?.toLowerCase().includes('spelling')).length,
        'Education': allIssues.filter(i => i.impact === 'SECTIONS' || i.title?.toLowerCase().includes('education')).length,
        'Bullet lengths': allIssues.filter(i => i.title?.toLowerCase().includes('bullet')).length,
        'Consistency': allIssues.filter(i => i.title?.toLowerCase().includes('consistency')).length,
        'Verb tenses': allIssues.filter(i => i.title?.toLowerCase().includes('verb') || i.title?.toLowerCase().includes('tense')).length,
        'Job fit': allIssues.filter(i => i.impact === 'ALL' || i.title?.toLowerCase().includes('job')).length
    };

    topFixesList.innerHTML = '';
    
    Object.entries(categories).forEach(([category, count]) => {
        if (count > 0) {
            const item = document.createElement('div');
            item.className = 'sidebar-item';
            item.innerHTML = `
                <span class="text-sm text-gray-700">${category}</span>
                <span class="text-sm font-bold text-gray-900">${count}</span>
            `;
            topFixesList.appendChild(item);
        }
    });
}

/**
 * Display main issues list with cards and FIX buttons
 */
function displayMainIssuesList(data) {
    if (!issuesList) return;
    
    issuesList.innerHTML = '';
    
    // Create issue cards
    allIssues.forEach((issue, index) => {
        const card = document.createElement('div');
        card.className = `issue-card severity-${issue.severity}`;
        card.innerHTML = `
            <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">${issue.title || issue.issue || 'Issue'}</h3>
                <p class="text-gray-600 mb-3">${issue.description || issue.suggestion || issue.issue || 'No description available'}</p>
                <div class="impact-badge">
                    ${getImpactIcon(issue.impact)} ${getImpactLabel(issue.impact)}
                </div>
            </div>
            <button class="fix-button" onclick="handleFixIssue('${issue.title || issue.issue}', ${index})">
                FIX →
            </button>
        `;
        issuesList.appendChild(card);
    });
}

/**
 * Display strengths section
 */
function displayStrengths(data) {
    if (!strengthsList || !strengthsSection) return;
    
    const insights = data.insights || {};
    const strengths = insights.strengths || [
        { title: "Page density", description: "Your page layout looks right." },
        { title: "Dates are in the right format", description: "Your dates are in the right format." },
        { title: "Unique action verbs and phrases", description: "You didn't overuse any verbs or phrases." }
    ];
    
    strengthsList.innerHTML = '';
    
    strengths.slice(0, 3).forEach(strength => {
        const item = document.createElement('div');
        item.className = 'strength-item';
        item.innerHTML = `
            <div class="check-icon">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold text-gray-900">${strength.title}:</h4>
                <p class="text-gray-600 mt-1">${strength.description}</p>
            </div>
        `;
        strengthsList.appendChild(item);
    });
}

/**
 * Get impact category from issue content
 */
function getImpactFromIssue(issue) {
    const text = (issue.title || issue.issue || '').toLowerCase();
    
    if (text.includes('bullet') || text.includes('length') || text.includes('brief')) return 'BREVITY';
    if (text.includes('verb') || text.includes('action') || text.includes('achieve')) return 'IMPACT';
    if (text.includes('education') || text.includes('section') || text.includes('format')) return 'SECTIONS';
    if (text.includes('style') || text.includes('font') || text.includes('format')) return 'STYLE';
    
    return 'ALL';
}

/**
 * Get impact icon for badge
 */
function getImpactIcon(impact) {
    const icons = {
        'BREVITY': '📝',
        'IMPACT': '⚡',
        'SECTIONS': '📋',
        'STYLE': '🎨',
        'ALL': '🎯'
    };
    return icons[impact] || '📌';
}

/**
 * Get impact label for badge
 */
function getImpactLabel(impact) {
    return impact || 'ALL';
}

/**
 * Handle fix issue button click
 */
window.handleFixIssue = function(issueTitle, issueIndex) {
    console.log(`Fix requested for: ${issueTitle}`);
    
    // For now, redirect to upgrade/payment
    if (upgradeBtn) {
        upgradeBtn.click();
    }
};

/**
 * Setup event handlers
 */
function setupEventHandlers() {
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            // Store current analysis data for payment page
            sessionStorage.setItem('pendingUpgrade', 'true');
            sessionStorage.setItem('upgradeSource', 'results_page');
            
            // Navigate to payment page
            window.location.href = './payment.html';
        });
    }
}

/**
 * Handle errors gracefully
 */
function handleError(error, context = '') {
    console.error(`Error in results page ${context}:`, error);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-50 border border-red-200 rounded-lg p-4 m-4';
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <svg class="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <div>
                <h3 class="text-sm font-medium text-red-800">Unable to load results</h3>
                <p class="text-sm text-red-700 mt-1">Please try analyzing your resume again.</p>
            </div>
        </div>
    `;
    
    // Insert error message at the top of the page
    const main = document.querySelector('main') || document.body;
    main.insertBefore(errorDiv, main.firstChild);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.debugResults = {
    analysisData: () => analysisData,
    allIssues: () => allIssues,
    reinit: init
};