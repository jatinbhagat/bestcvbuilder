/**
 * Main JavaScript file for BestCVBuilder landing page
 * Handles file upload, ATS analysis, and user flow
 * DEPLOY TRIGGER: Force rebuild for CORS fix - v2.1.0
 * VERCEL AUTO-DEPLOY: Trigger change v3.0 - Critical fix
 * REDEPLOY REQUEST: August 2nd 2025 - API URL fix needed
 * UI UPDATE: Added clean upload progress loader v3.1
 * CRITICAL FIX v1.1.0: Remove query params, force rebuild
 */

import { supabase } from './supabase.js';
import { uploadFile } from './fileUpload.js';
import { analyzeResumeWithFallback } from './atsAnalysis.js';

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const resumeFileInput = document.getElementById('resumeFile');
const uploadBtn = document.getElementById('uploadBtn');
const loadingState = document.getElementById('loadingState');

// File upload drop zone
const dropZone = document.querySelector('.border-dashed');

/**
 * Initialize the application
 */
function init() {
    console.log('BestCVBuilder initialized');
    setupEventListeners();
    checkUserSession();
}

/**
 * Set up event listeners for file upload and form submission
 */
function setupEventListeners() {
    // File input change
    resumeFileInput.addEventListener('change', handleFileSelect);
    
    // Form submission
    uploadForm.addEventListener('submit', handleFormSubmit);
    
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
    if (file) {
        validateAndProcessFile(file);
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const file = resumeFileInput.files[0];
    if (!file) {
        showError('Please select a resume file');
        return;
    }
    
    await processResumeUpload(file);
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
        
        // Show loading state
        setLoadingState(true);
        
        // Step 1: Upload file with progress
        console.log('📤 Step 1: Uploading file to storage...');
        showUploadProgress();
        const fileUrl = await uploadFile(file);
        console.log('✅ File uploaded successfully:', fileUrl);
        
        // Show upload complete
        showUploadComplete();
        await new Promise(resolve => setTimeout(resolve, 800)); // Brief pause to show completion
        
        // Step 2: Analyze resume
        console.log('🔍 Step 2: Starting ATS analysis...');
        showAnalysisProgress();
        const analysisResult = await analyzeResumeWithFallback(fileUrl);
        console.log('✅ Analysis completed:', analysisResult);
        
        // Validate analysis result
        if (!analysisResult || !analysisResult.score) {
            throw new Error('Invalid analysis result received');
        }
        
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
    dropZone.classList.add('border-primary-500', 'bg-primary-50');
}

function handleDragEnter(event) {
    event.preventDefault();
    dropZone.classList.add('border-primary-500', 'bg-primary-50');
}

function handleDragLeave(event) {
    event.preventDefault();
    dropZone.classList.remove('border-primary-500', 'bg-primary-50');
}

function handleDrop(event) {
    event.preventDefault();
    dropZone.classList.remove('border-primary-500', 'bg-primary-50');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        resumeFileInput.files = files;
        validateAndProcessFile(file);
    }
}

/**
 * Set loading state
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        uploadForm.classList.add('hidden');
        loadingState.classList.remove('hidden');
        uploadBtn.disabled = true;
        resetProgressStates();
    } else {
        uploadForm.classList.remove('hidden');
        loadingState.classList.add('hidden');
        uploadBtn.disabled = false;
    }
}

/**
 * Reset all progress states
 */
function resetProgressStates() {
    document.getElementById('uploadProgress').classList.remove('hidden');
    document.getElementById('uploadComplete').classList.add('hidden');
    document.getElementById('analysisProgress').classList.add('hidden');
    document.getElementById('uploadBar').style.width = '0%';
}

/**
 * Show upload progress with animated progress bar
 */
function showUploadProgress() {
    document.getElementById('uploadProgress').classList.remove('hidden');
    document.getElementById('uploadComplete').classList.add('hidden');
    document.getElementById('analysisProgress').classList.add('hidden');
    
    // Animate progress bar
    let progress = 0;
    const progressBar = document.getElementById('uploadBar');
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        progressBar.style.width = progress + '%';
    }, 100);
}

/**
 * Show upload complete state
 */
function showUploadComplete() {
    document.getElementById('uploadBar').style.width = '100%';
    setTimeout(() => {
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadComplete').classList.remove('hidden');
    }, 300);
}

/**
 * Show analysis progress
 */
function showAnalysisProgress() {
    document.getElementById('uploadComplete').classList.add('hidden');
    document.getElementById('analysisProgress').classList.remove('hidden');
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 