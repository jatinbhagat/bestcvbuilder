/**
 * Payment page JavaScript for handling payment processing
 * Manages payment form, Stripe integration, and user flow
 */

import { supabase, DatabaseService } from './supabase.js';

// DOM Elements
const paymentForm = document.getElementById('paymentForm');
const emailInput = document.getElementById('email');
const cardNumberInput = document.getElementById('cardNumber');
const expiryDateInput = document.getElementById('expiryDate');
const cvvInput = document.getElementById('cvv');
const termsCheckbox = document.getElementById('terms');
const payButton = document.getElementById('payButton');
const paymentLoading = document.getElementById('paymentLoading');

// Payment configuration
const PAYMENT_AMOUNT = 2900; // $29.00 in cents
const PAYMENT_CURRENCY = 'usd';

// Analysis data from session storage
let analysisData = null;

/**
 * Initialize the payment page
 */
function init() {
    console.log('Payment page initialized');
    loadAnalysisData();
    setupEventListeners();
    setupFormValidation();
}

/**
 * Load analysis data from session storage
 */
function loadAnalysisData() {
    try {
        const storedData = sessionStorage.getItem('upgradeAnalysis') || 
                          sessionStorage.getItem('currentAnalysis');
        
        if (storedData) {
            analysisData = JSON.parse(storedData);
            console.log('Loaded analysis data for payment:', analysisData);
        } else {
            console.warn('No analysis data found for payment');
            showError('No analysis data found. Please upload a resume first.');
        }
    } catch (error) {
        console.error('Error loading analysis data:', error);
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
    
    // Card number formatting
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
    }
    
    // Expiry date formatting
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', formatExpiryDate);
    }
    
    // CVV validation
    if (cvvInput) {
        cvvInput.addEventListener('input', validateCVV);
    }
}

/**
 * Set up form validation
 */
function setupFormValidation() {
    // Real-time validation
    const inputs = [emailInput, cardNumberInput, expiryDateInput, cvvInput];
    
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        }
    });
}

/**
 * Handle payment form submission
 */
async function handlePaymentSubmit(event) {
    event.preventDefault();
    
    console.log('Processing payment...');
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Process payment
        const paymentResult = await processPayment();
        
        // Save payment record
        await savePaymentRecord(paymentResult);
        
        // Trigger CV rewrite
        await triggerCVRewrite();
        
        // Redirect to success page
        window.location.href = './success.html';
        
    } catch (error) {
        console.error('Payment failed:', error);
        showError('Payment failed. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Validate the entire form
 */
function validateForm() {
    let isValid = true;
    
    // Validate email
    if (!validateEmail(emailInput.value)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate card number
    if (!validateCardNumber(cardNumberInput.value)) {
        showFieldError(cardNumberInput, 'Please enter a valid card number');
        isValid = false;
    }
    
    // Validate expiry date
    if (!validateExpiryDate(expiryDateInput.value)) {
        showFieldError(expiryDateInput, 'Please enter a valid expiry date (MM/YY)');
        isValid = false;
    }
    
    // Validate CVV
    if (!validateCVV(cvvInput.value)) {
        showFieldError(cvvInput, 'Please enter a valid CVV');
        isValid = false;
    }
    
    // Validate terms
    if (!termsCheckbox.checked) {
        showError('Please accept the terms and conditions');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Process payment with Stripe
 */
async function processPayment() {
    // In a real implementation, this would integrate with Stripe
    // For now, we'll simulate the payment process
    
    console.log('Processing payment with Stripe...');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful payment
    return {
        id: `pi_${Date.now()}`,
        amount: PAYMENT_AMOUNT,
        currency: PAYMENT_CURRENCY,
        status: 'succeeded',
        method: 'card',
        email: emailInput.value
    };
}

/**
 * Save payment record to database
 */
async function savePaymentRecord(paymentResult) {
    try {
        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id || 'anonymous';
        
        await DatabaseService.savePaymentRecord(userId, {
            amount: paymentResult.amount,
            status: paymentResult.status,
            method: paymentResult.method,
            payment_id: paymentResult.id
        });
        
        console.log('Payment record saved');
    } catch (error) {
        console.error('Failed to save payment record:', error);
    }
}

/**
 * Trigger CV rewrite process
 */
async function triggerCVRewrite() {
    try {
        console.log('Triggering resume improvement with Gemini AI...');
        
        // Call the Python API to fix/improve the resume
        const response = await fetch('/api/resume-fix', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                original_analysis: analysisData,
                user_email: emailInput.value,
                payment_id: `pi_${Date.now()}`
            })
        });
        
        if (!response.ok) {
            throw new Error('Resume improvement failed');
        }
        
        const rewriteResult = await response.json();
        console.log('Resume improvement completed:', rewriteResult);
        
        // Store rewrite result for success page
        sessionStorage.setItem('cvRewriteResult', JSON.stringify(rewriteResult));
        
    } catch (error) {
        console.error('CV rewrite failed:', error);
        throw error;
    }
}

/**
 * Format card number with spaces
 */
function formatCardNumber(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
        cardNumberInput.value = parts.join(' ');
    } else {
        cardNumberInput.value = v;
    }
}

/**
 * Format expiry date
 */
function formatExpiryDate(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
        expiryDateInput.value = v.substring(0, 2) + '/' + v.substring(2, 4);
    } else {
        expiryDateInput.value = v;
    }
}

/**
 * Validate email address
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate card number
 */
function validateCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    return cleanNumber.length >= 13 && cleanNumber.length <= 19;
}

/**
 * Validate expiry date
 */
function validateExpiryDate(expiryDate) {
    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!regex.test(expiryDate)) return false;
    
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year);
    const expMonth = parseInt(month);
    
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
}

/**
 * Validate CVV
 */
function validateCVV(cvv) {
    return cvv.length >= 3 && cvv.length <= 4 && /^\d+$/.test(cvv);
}

/**
 * Validate individual field
 */
function validateField(event) {
    const field = event.target;
    const value = field.value;
    
    let isValid = true;
    let errorMessage = '';
    
    switch (field.name) {
        case 'email':
            isValid = validateEmail(value);
            errorMessage = 'Please enter a valid email address';
            break;
        case 'cardNumber':
            isValid = validateCardNumber(value);
            errorMessage = 'Please enter a valid card number';
            break;
        case 'expiryDate':
            isValid = validateExpiryDate(value);
            errorMessage = 'Please enter a valid expiry date (MM/YY)';
            break;
        case 'cvv':
            isValid = validateCVV(value);
            errorMessage = 'Please enter a valid CVV';
            break;
    }
    
    if (!isValid && value) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
}

/**
 * Show field error
 */
function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('border-red-500');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-500 text-sm mt-1';
    errorDiv.textContent = message;
    errorDiv.id = `${field.name}-error`;
    
    field.parentNode.appendChild(errorDiv);
}

/**
 * Clear field error
 */
function clearFieldError(field) {
    field.classList.remove('border-red-500');
    
    const errorDiv = field.parentNode.querySelector(`#${field.name}-error`);
    if (errorDiv) {
        errorDiv.remove();
    }
}

/**
 * Set loading state
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        paymentForm.classList.add('hidden');
        paymentLoading.classList.remove('hidden');
        payButton.disabled = true;
    } else {
        paymentForm.classList.remove('hidden');
        paymentLoading.classList.add('hidden');
        payButton.disabled = false;
    }
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 