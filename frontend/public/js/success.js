/**
 * Success page JavaScript for handling download and feedback
 * Displays CV rewrite results and collects user feedback
 */

import { supabase, DatabaseService } from './supabase.js';

// DOM Elements
const originalScore = document.getElementById('originalScore');
const newScore = document.getElementById('newScore');
const improvement = document.getElementById('improvement');
const downloadBtn = document.getElementById('downloadBtn');
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const homeBtn = document.getElementById('homeBtn');
const optimizeForJobBtn = document.getElementById('optimizeForJobBtn');
const feedbackComment = document.getElementById('feedbackComment');

// Rating buttons
const ratingBtns = document.querySelectorAll('.rating-btn');

// CV rewrite data from session storage
let rewriteData = null;
let selectedRating = null;

/**
 * Initialize the success page
 */
function init() {
    console.log('Success page initialized');
    loadRewriteData();
    setupEventListeners();
}

/**
 * Load CV rewrite data from session storage
 */
function loadRewriteData() {
    try {
        const storedData = sessionStorage.getItem('cvRewriteResult');
        if (!storedData) {
            console.warn('No CV rewrite data found');
            showError('No CV rewrite data available.');
            return;
        }
        
        rewriteData = JSON.parse(storedData);
        console.log('Loaded CV rewrite data:', rewriteData);
        
        displayRewriteResults();
        
    } catch (error) {
        console.error('Error loading CV rewrite data:', error);
        showError('Failed to load CV rewrite results.');
    }
}

/**
 * Display CV rewrite results
 */
function displayRewriteResults() {
    if (!rewriteData) return;
    
    // Display score improvement
    const original = rewriteData.original_score || 0;
    const newScoreValue = rewriteData.new_score || 0;
    const improvementValue = rewriteData.score_improvement || 0;
    
    if (originalScore) originalScore.textContent = original;
    if (newScore) newScore.textContent = newScoreValue;
    if (improvement) {
        improvement.textContent = `+${improvementValue}`;
        improvement.className = improvementValue > 0 ? 'text-lg font-semibold text-success-600' : 'text-lg font-semibold text-gray-600';
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Download button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleDownload);
    }
    
    // Feedback submission
    if (submitFeedbackBtn) {
        submitFeedbackBtn.addEventListener('click', handleFeedbackSubmit);
    }
    
    // Navigation buttons
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', handleNewAnalysis);
    }
    
    if (homeBtn) {
        homeBtn.addEventListener('click', handleGoHome);
    }
    
    // Job optimization button
    if (optimizeForJobBtn) {
        optimizeForJobBtn.addEventListener('click', handleOptimizeForJob);
    }
    
    // Rating buttons
    ratingBtns.forEach(btn => {
        btn.addEventListener('click', handleRatingSelect);
    });
}

/**
 * Handle resume download
 */
async function handleDownload() {
    try {
        console.log('Initiating resume download...');
        
        if (!rewriteData || !rewriteData.improved_resume_url) {
            showError('Download link not available. Please check your email.');
            return;
        }
        
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = rewriteData.improved_resume_url;
        link.download = `improved_resume_${Date.now()}.pdf`;
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        showSuccess('Download started! Check your downloads folder.');
        
    } catch (error) {
        console.error('Download failed:', error);
        showError('Download failed. Please try again or check your email.');
    }
}

/**
 * Handle rating selection
 */
function handleRatingSelect(event) {
    const rating = parseInt(event.currentTarget.dataset.rating);
    selectedRating = rating;
    
    // Update visual state
    ratingBtns.forEach(btn => {
        btn.classList.remove('bg-primary-100', 'border-primary-500');
    });
    
    event.currentTarget.classList.add('bg-primary-100', 'border-primary-500');
}

/**
 * Handle feedback submission
 */
async function handleFeedbackSubmit() {
    try {
        if (!selectedRating) {
            showError('Please select a rating');
            return;
        }
        
        console.log('Submitting feedback...');
        
        // Get user data
        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id || 'anonymous';
        
        // Prepare feedback data
        const feedbackData = {
            rating: selectedRating.toString(),
            comment: feedbackComment.value.trim(),
            category: 'rewrite'
        };
        
        // Save feedback to database
        await DatabaseService.saveFeedback(userId, feedbackData);
        
        // Show success message
        showSuccess('Thank you for your feedback!');
        
        // Disable feedback form
        submitFeedbackBtn.disabled = true;
        submitFeedbackBtn.textContent = 'Feedback Submitted';
        
    } catch (error) {
        console.error('Feedback submission failed:', error);
        showError('Failed to submit feedback. Please try again.');
    }
}

/**
 * Handle new analysis button
 */
function handleNewAnalysis() {
    console.log('User wants new analysis');
    
    // Clear session storage
    sessionStorage.removeItem('atsAnalysis');
    sessionStorage.removeItem('currentAnalysis');
    sessionStorage.removeItem('upgradeAnalysis');
    sessionStorage.removeItem('cvRewriteResult');
    
    // Redirect to home page
    window.location.href = './index.html';
}

/**
 * Handle go home button
 */
function handleGoHome() {
    console.log('User going to home page');
    window.location.href = './index.html';
}

/**
 * Handle optimize for job button
 */
function handleOptimizeForJob() {
    console.log('User wants to optimize for specific job');
    
    // Store current rewrite data for job optimization context
    if (rewriteData) {
        sessionStorage.setItem('currentRewriteData', JSON.stringify(rewriteData));
    }
    
    // Navigate to job input page
    window.location.href = './job-input.html';
}

/**
 * Show success message
 */
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-success-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
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
 * Track user engagement
 */
function trackEngagement() {
    try {
        // Track page view
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: 'Success Page',
                page_location: window.location.href
            });
        }
        
        // Track conversion
        if (rewriteData) {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'purchase', {
                    transaction_id: rewriteData.payment_id || 'unknown',
                    value: 29.00,
                    currency: 'USD'
                });
            }
        }
        
    } catch (error) {
        console.error('Error tracking engagement:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    trackEngagement();
}); 