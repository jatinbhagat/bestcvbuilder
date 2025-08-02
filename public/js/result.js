/**
 * Results page JavaScript for displaying ATS analysis results
 * Handles score display, upgrade flow, and user interactions
 */

import { supabase, DatabaseService } from './supabase.js';
import { getScoreDescription, getImprovementSuggestions, calculatePotentialImprovement } from './atsAnalysis.js';

// DOM Elements
const atsScore = document.getElementById('atsScore');
const scoreTitle = document.getElementById('scoreTitle');
const scoreDescription = document.getElementById('scoreDescription');
const strengthsList = document.getElementById('strengthsList');
const improvementsList = document.getElementById('improvementsList');
const detailedAnalysis = document.getElementById('detailedAnalysis');
const upgradeBtn = document.getElementById('upgradeBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const downloadReportBtn = document.getElementById('downloadReportBtn');

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
function loadAnalysisData() {
    try {
        const storedData = sessionStorage.getItem('atsAnalysis');
        if (!storedData) {
            console.error('No analysis data found');
            showError('No analysis data available. Please upload a resume first.');
            return;
        }
        
        analysisData = JSON.parse(storedData);
        console.log('Loaded analysis data:', analysisData);
        
        displayAnalysisResults();
        
    } catch (error) {
        console.error('Error loading analysis data:', error);
        showError('Failed to load analysis results.');
    }
}

/**
 * Display analysis results on the page
 */
function displayAnalysisResults() {
    if (!analysisData) return;
    
    // Display ATS score
    displayScore(analysisData.score, analysisData.scoreCategory);
    
    // Display strengths
    displayStrengths(analysisData.strengths);
    
    // Display improvements
    displayImprovements(analysisData.improvements);
    
    // Display detailed analysis
    displayDetailedAnalysis(analysisData.detailedAnalysis);
    
    // Store data for payment flow
    sessionStorage.setItem('currentAnalysis', JSON.stringify(analysisData));
}

/**
 * Display ATS score with category
 */
function displayScore(score, category) {
    if (atsScore) {
        atsScore.textContent = score;
    }
    
    if (scoreTitle) {
        scoreTitle.textContent = `ATS Score: ${getScoreCategoryLabel(category)}`;
    }
    
    if (scoreDescription) {
        scoreDescription.textContent = getScoreDescription(category);
    }
    
    // Update score color based on category
    updateScoreColor(category);
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
 * Update score color based on category
 */
function updateScoreColor(category) {
    const scoreContainer = atsScore?.parentElement;
    if (!scoreContainer) return;
    
    // Remove existing color classes
    scoreContainer.classList.remove('bg-primary-100', 'bg-success-100', 'bg-warning-100', 'bg-red-100');
    atsScore.classList.remove('text-primary-600', 'text-success-600', 'text-warning-600', 'text-red-600');
    
    // Add appropriate color classes
    switch (category) {
        case 'excellent':
            scoreContainer.classList.add('bg-success-100');
            atsScore.classList.add('text-success-600');
            break;
        case 'good':
            scoreContainer.classList.add('bg-primary-100');
            atsScore.classList.add('text-primary-600');
            break;
        case 'fair':
            scoreContainer.classList.add('bg-warning-100');
            atsScore.classList.add('text-warning-600');
            break;
        case 'poor':
        case 'very_poor':
            scoreContainer.classList.add('bg-red-100');
            atsScore.classList.add('text-red-600');
            break;
    }
}

/**
 * Display strengths list
 */
function displayStrengths(strengths) {
    if (!strengthsList || !strengths) return;
    
    strengthsList.innerHTML = '';
    
    strengths.forEach(strength => {
        const li = document.createElement('li');
        li.className = 'flex items-start';
        li.innerHTML = `
            <svg class="w-5 h-5 text-success-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-gray-700">${strength}</span>
        `;
        strengthsList.appendChild(li);
    });
}

/**
 * Display improvements list
 */
function displayImprovements(improvements) {
    if (!improvementsList || !improvements) return;
    
    improvementsList.innerHTML = '';
    
    improvements.forEach(improvement => {
        const li = document.createElement('li');
        li.className = 'flex items-start';
        li.innerHTML = `
            <svg class="w-5 h-5 text-warning-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <span class="text-gray-700">${improvement}</span>
        `;
        improvementsList.appendChild(li);
    });
}

/**
 * Display detailed analysis
 */
function displayDetailedAnalysis(analysis) {
    if (!detailedAnalysis || !analysis) return;
    
    detailedAnalysis.innerHTML = `
        <p class="text-gray-700 leading-relaxed">${analysis}</p>
    `;
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 