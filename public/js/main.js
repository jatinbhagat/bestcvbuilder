/**
 * Main JavaScript file for BestCVBuilder landing page
 * Handles file upload, ATS analysis, and user flow
 */

import { supabase } from './supabase.js';
import { uploadFile } from './fileUpload.js';
import { analyzeResume } from './atsAnalysis.js';

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
    
    return true;
}

/**
 * Process resume upload and analysis
 */
async function processResumeUpload(file) {
    try {
        // Show loading state
        setLoadingState(true);
        
        // Upload file to Supabase storage
        const fileUrl = await uploadFile(file);
        console.log('File uploaded:', fileUrl);
        
        // Analyze resume with ATS engine
        const analysisResult = await analyzeResume(fileUrl);
        console.log('Analysis result:', analysisResult);
        
        // Store analysis result in session storage
        sessionStorage.setItem('atsAnalysis', JSON.stringify(analysisResult));
        
        // Redirect to results page
        window.location.href = './result.html';
        
    } catch (error) {
        console.error('Error processing resume:', error);
        showError('Failed to analyze resume. Please try again.');
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
    } else {
        uploadForm.classList.remove('hidden');
        loadingState.classList.add('hidden');
        uploadBtn.disabled = false;
    }
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