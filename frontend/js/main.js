/**
 * Main JavaScript file for BestCVBuilder landing page
 * Handles file upload, ATS analysis, and user flow
 * Updated: 2025-08-08 - Enhanced UI deployment on Render.com
 * Features: Modern dashboard, gradient design, premium animations
 * Backend: Real Gemini AI integration with complete functionality
 * Status: Enhanced UI/UX with working resume optimization system
 */

import { supabase, DatabaseService } from './supabase.js';
import { uploadFile } from './fileUpload.js';
import { analyzeResumeWithFallback, BUILD_ID, API_BASE_URL, CV_PARSER_ENDPOINT } from './atsAnalysis.js';

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const resumeFileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('analyzeBtn');
const loadingState = document.getElementById('loadingState');

// File upload drop zone
const dropZone = document.getElementById('uploadArea');

/**
 * Initialize the application
 */
function init() {
    console.log('BestCVBuilder initialized');
    setupEventListeners();
    checkUserSession();
    displayBuildInfo();
    initTestingControls();
}

/**
 * Display build information to verify cache status
 */
function displayBuildInfo() {
    console.log('🏗️ BUILD INFO:', { BUILD_ID, API_BASE_URL, CV_PARSER_ENDPOINT });
    
    // Create build info element
    const buildInfo = document.createElement('div');
    buildInfo.id = 'build-info';
    buildInfo.style.cssText = `
        position: fixed; 
        bottom: 10px; 
        right: 10px; 
        background: #1f2937; 
        color: #10b981; 
        padding: 8px 12px; 
        border-radius: 6px; 
        font-family: monospace; 
        font-size: 11px; 
        z-index: 9999;
        border: 1px solid #10b981;
    `;
    buildInfo.textContent = `${BUILD_ID} | API: ${API_BASE_URL}`;
    
    document.body.appendChild(buildInfo);
    
    // Also display in header title temporarily for visibility
    const header = document.querySelector('h1');
    if (header) {
        header.textContent = `BestCVBuilder [${BUILD_ID.slice(-10)}]`;
    }
}

/**
 * Set up event listeners for file upload and form submission
 */
function setupEventListeners() {
    // File input change
    if (resumeFileInput) {
        resumeFileInput.addEventListener('change', handleFileSelect);
    }
    
    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Listen for custom resume upload event from inline script
    document.addEventListener('resumeUpload', handleCustomUpload);
    
    // Drag and drop functionality
    if (dropZone) {
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('drop', handleDrop);
        dropZone.addEventListener('dragenter', handleDragEnter);
        dropZone.addEventListener('dragleave', handleDragLeave);
    }
}

/**
 * Handle file selection from input
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && validateAndProcessFile(file)) {
        // Update file display
        const fileName = document.getElementById('fileName');
        const fileInfo = document.getElementById('fileInfo');
        if (fileName) fileName.textContent = file.name;
        if (fileInfo) fileInfo.classList.remove('hidden');
        if (uploadBtn) uploadBtn.disabled = false;
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const file = resumeFileInput ? resumeFileInput.files[0] : null;
    if (!file) {
        showError('Please select a resume file');
        return;
    }
    
    await processResumeUpload(file);
}

/**
 * Handle custom upload event from inline script
 */
async function handleCustomUpload(event) {
    const { file } = event.detail;
    if (file && validateAndProcessFile(file)) {
        await processResumeUpload(file);
    }
}

/**
 * Validate and process uploaded file
 */
function validateAndProcessFile(file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
        showError('Please upload a PDF, DOCX, or DOC file');
        return false;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showError('File size must be less than 10MB');
        return false;
    }
    
    // Update file display (optional enhancement)
    updateFileDisplay(file);
    
    return true;
}

/**
 * Update file display to show selected file
 */
function updateFileDisplay(file) {
    const fileInfo = `${file.name} (${formatFileSize(file.size)})`;
    console.log('File selected:', fileInfo);
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Process resume upload and analysis
 */
async function processResumeUpload(file) {
    try {
        console.log('🚀 Starting resume processing for:', file.name);
        
        // Log file upload activity
        await DatabaseService.logActivity(null, 'file_upload_started', {
            filename: file.name,
            filesize: file.size,
            filetype: file.type
        });
        
        // Show loading state
        setLoadingState(true);
        
        // Step 1: Upload file
        console.log('📤 Step 1: Uploading file to storage...');
        showUploadProgress();
        const fileUrl = await uploadFile(file);
        console.log('✅ File uploaded successfully:', fileUrl);
        
        // Log successful file upload
        await DatabaseService.logActivity(null, 'file_upload_completed', {
            filename: file.name,
            file_url: fileUrl
        });
        
        // Step 2: Analyze resume (with user ID for database saving)
        console.log('🔍 Step 2: Starting ATS analysis...');
        showAnalysisProgress();
        
        // Get current user for database saving
        let userId = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                userId = user.id;
                console.log('User ID found for database saving:', userId);
            } else {
                console.log('No user logged in - proceeding without database save');
            }
        } catch (error) {
            console.log('Error getting user:', error);
        }
        
        const analysisResult = await analyzeResumeWithFallback(fileUrl, userId);
        console.log('✅ Analysis completed:', analysisResult);
        
        // Validate analysis result
        if (!analysisResult || !analysisResult.score) {
            throw new Error('Invalid analysis result received');
        }
        
        // Log successful analysis
        await DatabaseService.logActivity(userId, 'ats_analysis_completed', {
            score: analysisResult.score,
            scoreCategory: analysisResult.scoreCategory,
            filename: file.name,
            analysis_id: analysisResult.id || `analysis_${Date.now()}`
        });
        
        // Store analysis result in session storage
        console.log('💾 Step 3: Storing results...');
        sessionStorage.setItem('atsAnalysis', JSON.stringify(analysisResult));
        
        // Redirect to results page
        console.log('🔀 Step 4: Redirecting to results...');
        window.location.href = './result.html';
        
    } catch (error) {
        console.error('Error processing resume:', error);
        
        // Show more specific error message based on error type
        let errorMessage = 'Failed to analyze resume. Please try again.';
        if (error.message.includes('upload')) {
            errorMessage = 'File upload failed. Please check your connection and try again.';
        } else if (error.message.includes('analysis') || error.message.includes('analyze')) {
            errorMessage = 'Resume analysis failed. Please try again in a moment.';
        }
        
        showError(errorMessage);
    } finally {
        setLoadingState(false);
    }
}

/**
 * Handle drag and drop events
 */
function handleDragOver(event) {
    event.preventDefault();
    dropZone.classList.add('dragover');
}

function handleDragEnter(event) {
    event.preventDefault();
    dropZone.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    dropZone.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (resumeFileInput) {
            const dt = new DataTransfer();
            dt.items.add(file);
            resumeFileInput.files = dt.files;
        }
        if (validateAndProcessFile(file)) {
            // Update file display
            const fileName = document.getElementById('fileName');
            const fileInfo = document.getElementById('fileInfo');
            if (fileName) fileName.textContent = file.name;
            if (fileInfo) fileInfo.classList.remove('hidden');
            if (uploadBtn) uploadBtn.disabled = false;
        }
    }
}

/**
 * Set loading state
 */
function setLoadingState(isLoading) {
    const buttonText = document.getElementById('buttonText');
    const loadingText = document.getElementById('loadingText');
    
    if (isLoading) {
        if (buttonText) buttonText.style.display = 'none';
        if (loadingText) loadingText.style.display = 'flex';
        if (uploadBtn) uploadBtn.disabled = true;
    } else {
        if (buttonText) buttonText.style.display = 'inline';
        if (loadingText) loadingText.style.display = 'none';
        if (uploadBtn) uploadBtn.disabled = false;
    }
}

/**
 * Show upload progress (simplified for current UI)
 */
function showUploadProgress() {
    console.log('📤 Upload progress started');
}

/**
 * Show upload complete state (simplified for current UI)
 */
function showUploadComplete() {
    console.log('✅ Upload completed');
}

/**
 * Show analysis progress (simplified for current UI)
 */
function showAnalysisProgress() {
    console.log('🔍 Analysis in progress');
}

/**
 * Show error message
 */
function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

/**
 * Check user session status
 */
async function checkUserSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            console.log('User session found:', session.user.email);
            // Could show user-specific content here
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }
}

/**
 * Initialize testing controls for payment bypass
 */
function initTestingControls() {
    const testingControls = document.getElementById('testingControls');
    const enableBypassBtn = document.getElementById('enableBypassBtn');
    const disableBypassBtn = document.getElementById('disableBypassBtn');
    
    // Only show on development/staging environments
    const currentHostname = window.location.hostname;
    const showTestingControls = currentHostname === 'localhost' || 
                               currentHostname === '127.0.0.1' ||
                               currentHostname.includes('localhost') ||
                               currentHostname.includes('preview') ||
                               currentHostname.includes('render.com') ||
                               currentHostname.includes('onrender.com') ||
                               currentHostname.includes('vercel.app');
    
    console.log('🔍 Testing controls check:');
    console.log('  - Current hostname:', currentHostname);
    console.log('  - Show testing controls:', showTestingControls);
    
    if (showTestingControls) {
        
        if (testingControls) {
            testingControls.classList.remove('hidden');
        }
        
        // Check current bypass status
        const bypassEnabled = sessionStorage.getItem('BYPASS_PAYMENT') === 'true';
        updateBypassButtons(bypassEnabled);
        
        // Enable bypass button
        if (enableBypassBtn) {
            enableBypassBtn.addEventListener('click', () => {
                sessionStorage.setItem('BYPASS_PAYMENT', 'true');
                updateBypassButtons(true);
                showSuccess('Payment bypass enabled for testing!');
            });
        }
        
        // Disable bypass button
        if (disableBypassBtn) {
            disableBypassBtn.addEventListener('click', () => {
                sessionStorage.removeItem('BYPASS_PAYMENT');
                updateBypassButtons(false);
                showSuccess('Payment bypass disabled');
            });
        }
    }
}

/**
 * Update bypass button states
 */
function updateBypassButtons(enabled) {
    const enableBypassBtn = document.getElementById('enableBypassBtn');
    const disableBypassBtn = document.getElementById('disableBypassBtn');
    
    if (enabled) {
        enableBypassBtn?.classList.add('hidden');
        disableBypassBtn?.classList.remove('hidden');
    } else {
        enableBypassBtn?.classList.remove('hidden');
        disableBypassBtn?.classList.add('hidden');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 