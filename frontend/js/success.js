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
    
    // Log success page visit
    DatabaseService.logActivity(null, 'success_page_visited', {
        source: 'upgrade_flow',
        timestamp: new Date().toISOString()
    });
    
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
    
    // Display debug information if available
    displayDebugInfo();
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
        console.log('Rewrite data:', rewriteData);
        
        if (!rewriteData) {
            showError('No rewrite data available. Please try the process again.');
            return;
        }
        
        if (!rewriteData.improved_resume_url) {
            console.error('Missing improved_resume_url in rewrite data');
            showError('Download link not available. Please contact support.');
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
        showError('Download failed. Please try again or contact support.');
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
    
    // Log job optimization button click
    DatabaseService.logActivity(null, 'job_optimization_started', {
        original_score: rewriteData?.original_score || 'unknown',
        new_score: rewriteData?.new_score || 'unknown'
    });
    
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
 * Display debug information if available
 */
function displayDebugInfo() {
    if (!rewriteData?.debug) return;
    
    console.log('Debug data available:', rewriteData.debug);
    
    try {
        // Create debug section container
        const existingDebugSection = document.getElementById('debugSection');
        if (existingDebugSection) {
            existingDebugSection.remove();
        }
        
        const debugSection = document.createElement('div');
        debugSection.id = 'debugSection';
        debugSection.className = 'mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200';
        
        const debugData = rewriteData.debug;
        
        // Debug header
        debugSection.innerHTML = `
            <h3 class="text-lg font-bold text-gray-900 mb-4">🔍 Debug Information</h3>
            
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div class="text-sm">
                    <div class="font-medium text-gray-700">Original Text:</div>
                    <div class="text-gray-600">${debugData.text_analysis?.original_length || 0} characters, ${debugData.text_analysis?.original_lines || 0} lines</div>
                </div>
                <div class="text-sm">
                    <div class="font-medium text-gray-700">Improved Text:</div>
                    <div class="text-gray-600">${debugData.text_analysis?.improved_length || 0} characters, ${debugData.text_analysis?.improved_lines || 0} lines</div>
                </div>
            </div>
            
            <div class="mb-4">
                <div class="text-sm">
                    <div class="font-medium text-gray-700">Content Preservation:</div>
                    <div class="text-gray-600">
                        Length ratio: ${Math.round((debugData.text_analysis?.length_ratio || 0) * 100)}%
                        ${debugData.text_analysis?.content_preserved ? 
                          '<span class="text-green-600 font-medium ml-2">✅ Good preservation</span>' : 
                          '<span class="text-red-600 font-medium ml-2">⚠️ Potential content loss</span>'}
                    </div>
                </div>
            </div>
            
            <div class="space-y-2">
                <h4 class="font-medium text-gray-700">Download Debug Files:</h4>
                <div class="grid md:grid-cols-3 gap-2">
                    <button id="downloadOriginalText" class="px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors">
                        📄 Original Text
                    </button>
                    <button id="downloadImprovedText" class="px-3 py-2 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors">
                        ✨ Improved Text
                    </button>
                    <button id="downloadComparison" class="px-3 py-2 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors">
                        📊 Comparison
                    </button>
                </div>
            </div>
        `;
        
        // Add debug section to page
        const mainContent = document.querySelector('.max-w-4xl') || document.querySelector('main') || document.body;
        mainContent.appendChild(debugSection);
        
        // Add event listeners for debug downloads
        setupDebugDownloads(debugData);
        
    } catch (error) {
        console.error('Error displaying debug info:', error);
    }
}

/**
 * Setup debug download functionality
 */
function setupDebugDownloads(debugData) {
    const downloads = debugData.downloads || {};
    
    // Original text download
    const originalBtn = document.getElementById('downloadOriginalText');
    if (originalBtn && downloads.original_text) {
        originalBtn.addEventListener('click', () => {
            downloadDataUrl(downloads.original_text.data_url, downloads.original_text.filename);
        });
    }
    
    // Improved text download
    const improvedBtn = document.getElementById('downloadImprovedText');
    if (improvedBtn && downloads.improved_text) {
        improvedBtn.addEventListener('click', () => {
            downloadDataUrl(downloads.improved_text.data_url, downloads.improved_text.filename);
        });
    }
    
    // Comparison download
    const comparisonBtn = document.getElementById('downloadComparison');
    if (comparisonBtn && downloads.comparison) {
        comparisonBtn.addEventListener('click', () => {
            downloadDataUrl(downloads.comparison.data_url, downloads.comparison.filename);
        });
    }
}

/**
 * Download a data URL as a file
 */
function downloadDataUrl(dataUrl, filename) {
    try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess(`Downloaded ${filename}`);
    } catch (error) {
        console.error('Download failed:', error);
        showError('Download failed. Please try again.');
    }
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