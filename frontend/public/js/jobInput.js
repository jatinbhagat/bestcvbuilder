import { supabase, DatabaseService } from './supabase.js';

// DOM Elements
const jobInputForm = document.getElementById('jobInputForm');
const analyzeJobBtn = document.getElementById('analyzeJobBtn');
const buttonText = document.getElementById('buttonText');
const loadingText = document.getElementById('loadingText');
const formErrors = document.getElementById('formErrors');
const errorMessages = document.getElementById('errorMessages');

// Form input elements
const roleTitle = document.getElementById('roleTitle');
const companyName = document.getElementById('companyName');
const jobDescription = document.getElementById('jobDescription');
const salaryMin = document.getElementById('salaryMin');
const salaryMax = document.getElementById('salaryMax');
const additionalNotes = document.getElementById('additionalNotes');

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '/api' 
    : '/api';

let currentUserId = null;

/**
 * Initialize job input functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Job input page initialized');
    
    initializeUser();
    setupEventListeners();
    setupFormValidation();
});

/**
 * Initialize user session
 */
async function initializeUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Error getting user:', error);
            // Continue as anonymous user
            currentUserId = 'anonymous_' + Date.now();
            return;
        }
        
        if (user) {
            currentUserId = user.id;
            console.log('User authenticated:', user.email);
        } else {
            // Handle anonymous user
            currentUserId = 'anonymous_' + Date.now();
            console.log('Anonymous user session');
        }
        
    } catch (error) {
        console.error('Error initializing user:', error);
        currentUserId = 'anonymous_' + Date.now();
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Form submission
    if (jobInputForm) {
        jobInputForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Real-time form validation
    const formInputs = [roleTitle, jobDescription];
    formInputs.forEach(input => {
        if (input) {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        }
    });
    
    // Character count for job description
    if (jobDescription) {
        jobDescription.addEventListener('input', updateCharacterCount);
    }
}

/**
 * Set up form validation
 */
function setupFormValidation() {
    // Add character counter to job description
    if (jobDescription) {
        const container = jobDescription.parentElement;
        const counter = document.createElement('div');
        counter.id = 'charCounter';
        counter.className = 'text-xs text-gray-500 mt-1 text-right';
        counter.textContent = '0 characters';
        container.appendChild(counter);
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    console.log('Job input form submitted');
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Set loading state
    setLoadingState(true);
    hideFormErrors();
    
    try {
        // Collect form data
        const formData = collectFormData();
        
        // Store job data locally first
        sessionStorage.setItem('jobInputData', JSON.stringify(formData));
        
        // Call job analyzer API
        const analysisResult = await analyzeJobRequirements(formData);
        
        // Save to database
        await saveJobAnalysis(formData, analysisResult);
        
        // Store analysis result
        sessionStorage.setItem('jobAnalysisResult', JSON.stringify(analysisResult));
        
        // Navigate to optimization results
        showSuccess();
        setTimeout(() => {
            window.location.href = './optimization-results.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error processing job input:', error);
        showFormErrors([error.message || 'Failed to analyze job requirements. Please try again.']);
    } finally {
        setLoadingState(false);
    }
}

/**
 * Collect form data
 */
function collectFormData() {
    const focusAreas = Array.from(document.querySelectorAll('input[name="focusAreas"]:checked'))
        .map(checkbox => checkbox.value);
    
    return {
        roleTitle: roleTitle.value.trim(),
        companyName: companyName.value.trim(),
        jobDescription: jobDescription.value.trim(),
        salaryRange: {
            min: salaryMin.value.trim(),
            max: salaryMax.value.trim()
        },
        focusAreas: focusAreas,
        additionalNotes: additionalNotes.value.trim(),
        timestamp: new Date().toISOString(),
        userId: currentUserId
    };
}

/**
 * Validate form data
 */
function validateForm() {
    const errors = [];
    
    // Required fields
    if (!roleTitle.value.trim()) {
        errors.push('Job title is required');
        markFieldError(roleTitle);
    }
    
    if (!jobDescription.value.trim()) {
        errors.push('Job description is required');
        markFieldError(jobDescription);
    } else if (jobDescription.value.trim().length < 50) {
        errors.push('Job description should be at least 50 characters long');
        markFieldError(jobDescription);
    }
    
    // Show errors if any
    if (errors.length > 0) {
        showFormErrors(errors);
        return false;
    }
    
    return true;
}

/**
 * Validate individual field
 */
function validateField(event) {
    const field = event.target;
    clearFieldError(field);
    
    if (field === roleTitle && !field.value.trim()) {
        markFieldError(field, 'Job title is required');
    }
    
    if (field === jobDescription) {
        if (!field.value.trim()) {
            markFieldError(field, 'Job description is required');
        } else if (field.value.trim().length < 50) {
            markFieldError(field, 'Job description should be at least 50 characters');
        }
    }
}

/**
 * Mark field with error
 */
function markFieldError(field, message = null) {
    field.classList.add('border-red-500');
    field.classList.remove('border-gray-200', 'border-blue-500');
    
    if (message) {
        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-red-500 text-xs mt-1';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
    }
}

/**
 * Clear field error
 */
function clearFieldError(field) {
    if (typeof field === 'object' && field.target) {
        field = field.target;
    }
    
    field.classList.remove('border-red-500');
    field.classList.add('border-gray-200');
    
    // Remove error message
    const errorDiv = field.parentElement.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

/**
 * Update character count for job description
 */
function updateCharacterCount() {
    const counter = document.getElementById('charCounter');
    if (counter) {
        const count = jobDescription.value.length;
        counter.textContent = `${count} characters`;
        
        if (count < 50) {
            counter.classList.add('text-red-500');
            counter.classList.remove('text-gray-500');
        } else {
            counter.classList.add('text-gray-500');
            counter.classList.remove('text-red-500');
        }
    }
}

/**
 * Call job analyzer API
 */
async function analyzeJobRequirements(formData) {
    console.log('Calling job analyzer API...');
    
    const response = await fetch(`${API_BASE_URL}/job-analyzer`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            job_description: formData.jobDescription,
            role_title: formData.roleTitle,
            company_name: formData.companyName,
            user_expectations: {
                salary_range: formData.salaryRange,
                focus_areas: formData.focusAreas,
                additional_notes: formData.additionalNotes
            }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to analyze job requirements`);
    }
    
    const result = await response.json();
    console.log('Job analysis completed:', result);
    
    return result;
}

/**
 * Save job analysis to database
 */
async function saveJobAnalysis(formData, analysisResult) {
    try {
        console.log('Saving job analysis to database...');
        
        const jobAnalysisData = {
            user_id: currentUserId,
            role_title: formData.roleTitle,
            company_name: formData.companyName,
            job_description: formData.jobDescription,
            extracted_requirements: analysisResult.extracted_requirements || {},
            user_expectations: {
                salary_range: formData.salaryRange,
                focus_areas: formData.focusAreas,
                additional_notes: formData.additionalNotes
            },
            analysis_score: analysisResult.analysis_score || 0,
            matching_keywords: analysisResult.matching_keywords || [],
            created_at: new Date().toISOString()
        };
        
        // Save to Supabase
        if (currentUserId.startsWith('anonymous_')) {
            // For anonymous users, just store in session storage
            sessionStorage.setItem('jobAnalysisData', JSON.stringify(jobAnalysisData));
            console.log('Job analysis stored in session for anonymous user');
        } else {
            // For authenticated users, save to database
            await DatabaseService.saveJobAnalysis(currentUserId, jobAnalysisData);
            console.log('Job analysis saved to database');
        }
        
    } catch (error) {
        console.error('Error saving job analysis:', error);
        // Don't throw error here, as the analysis was successful
        // Just log the database save failure
    }
}

/**
 * Set loading state
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        analyzeJobBtn.disabled = true;
        buttonText.style.display = 'none';
        loadingText.style.display = 'flex';
        loadingText.classList.remove('hidden');
    } else {
        analyzeJobBtn.disabled = false;
        buttonText.style.display = 'inline';
        loadingText.style.display = 'none';
        loadingText.classList.add('hidden');
    }
}

/**
 * Show form errors
 */
function showFormErrors(errors) {
    errorMessages.innerHTML = errors.map(error => `<div>• ${error}</div>`).join('');
    formErrors.classList.remove('hidden');
    
    // Scroll to errors
    formErrors.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Hide form errors
 */
function hideFormErrors() {
    formErrors.classList.add('hidden');
}

/**
 * Show success message
 */
function showSuccess() {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center';
    successDiv.innerHTML = `
        <span class="mr-2">✅</span>
        <div>
            <div class="font-bold">Job Analysis Complete!</div>
            <div class="text-sm opacity-90">Preparing your optimized resume...</div>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after animation
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

/**
 * Show error notification
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
    errorDiv.innerHTML = `<span class="mr-2">❌</span> ${message}`;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Utility function to track analytics
function trackEvent(eventName, properties = {}) {
    try {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
        console.log('Event tracked:', eventName, properties);
    } catch (error) {
        console.error('Error tracking event:', error);
    }
}

// Track page view
trackEvent('job_input_page_view', {
    page_title: 'Job Input',
    page_location: window.location.href
});