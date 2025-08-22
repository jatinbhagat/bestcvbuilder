/**
 * Create Order JavaScript - PayU Integration
 * Handles order creation, contact info extraction, and PayU payment initiation
 */

// Global variables
let analysisData = null;
let contactInfo = null;
let currentOrder = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Initializing order creation page...');
    loadAnalysisData();
    setupEventListeners();
});

/**
 * Load analysis data from session storage
 */
function loadAnalysisData() {
    try {
        // Try both session storage keys
        let rawData = sessionStorage.getItem('pendingAnalysis') || sessionStorage.getItem('atsAnalysis');
        if (rawData) {
            analysisData = JSON.parse(rawData);
            console.log('📊 Analysis data loaded:', analysisData);
            
            // Create order with contact extraction
            createOrderWithContactExtraction();
        } else {
            console.error('❌ No analysis data found');
            showError('No resume analysis data found. Please go back and analyze your resume first.');
        }
    } catch (error) {
        console.error('❌ Error loading analysis data:', error);
        showError('Failed to load resume data. Please try again.');
    }
}

/**
 * Create order and extract contact information
 */
async function createOrderWithContactExtraction() {
    try {
        console.log('🔍 Creating order with contact extraction...');
        
        const response = await fetch('/api/orders/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                analysis_data: analysisData
            })
        });
        
        if (!response.ok) {
            throw new Error(`Order creation failed: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Order created:', result);
        
        currentOrder = result.order;
        contactInfo = result.contact_info;
        
        // Populate contact information
        populateContactInformation();
        
    } catch (error) {
        console.error('❌ Order creation error:', error);
        showError('Failed to create order. Please try again.');
    }
}

/**
 * Populate contact information from extracted data
 */
function populateContactInformation() {
    try {
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const phoneSelect = document.getElementById('phoneSelect');
        const contactAlert = document.getElementById('contactInfoAlert');
        const extractedText = document.getElementById('extractedInfoText');
        
        let alertMessage = '';
        
        // Handle email
        if (contactInfo.emails && contactInfo.emails.length > 0) {
            emailInput.value = contactInfo.primary_email || contactInfo.emails[0];
            alertMessage += `📧 ${contactInfo.emails.length} email${contactInfo.emails.length > 1 ? 's' : ''} found. `;
            
            // If multiple emails, show them in the alert
            if (contactInfo.emails.length > 1) {
                alertMessage += `(Options: ${contactInfo.emails.join(', ')}) `;
            }
        }
        
        // Handle phone numbers
        if (contactInfo.phone_numbers && contactInfo.phone_numbers.length > 0) {
            if (contactInfo.phone_numbers.length === 1) {
                // Single phone number - use input field
                phoneInput.value = contactInfo.primary_phone || contactInfo.phone_numbers[0];
                alertMessage += `📱 Phone number found.`;
            } else {
                // Multiple phone numbers - show dropdown
                phoneSelect.style.display = 'block';
                phoneInput.style.display = 'none';
                
                // Populate dropdown
                phoneSelect.innerHTML = '<option value="">Select a phone number</option>';
                contactInfo.phone_numbers.forEach(phone => {
                    const option = document.createElement('option');
                    option.value = phone;
                    option.textContent = phone;
                    phoneSelect.appendChild(option);
                });
                
                // Select the primary phone
                if (contactInfo.primary_phone) {
                    phoneSelect.value = contactInfo.primary_phone;
                }
                
                alertMessage += `📱 ${contactInfo.phone_numbers.length} phone numbers found. Please select one.`;
            }
        }
        
        // Show contact info alert if any info was extracted
        if (alertMessage) {
            extractedText.textContent = alertMessage;
            contactAlert.style.display = 'block';
        }
        
        console.log('📝 Contact information populated');
        
    } catch (error) {
        console.error('❌ Error populating contact info:', error);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const orderForm = document.getElementById('orderForm');
    const phoneSelect = document.getElementById('phoneSelect');
    
    // Form submission
    orderForm.addEventListener('submit', handleOrderSubmission);
    
    // Phone selection change
    phoneSelect.addEventListener('change', function() {
        const phoneInput = document.getElementById('phone');
        phoneInput.value = this.value;
    });
    
    // Real-time validation
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    emailInput.addEventListener('blur', validateEmail);
    phoneInput.addEventListener('blur', validatePhone);
}

/**
 * Validate email field
 */
function validateEmail() {
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const email = emailInput.value.trim();
    
    if (!email) {
        showFieldError(emailInput, emailError, 'Email address is required');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showFieldError(emailInput, emailError, 'Please enter a valid email address');
        return false;
    }
    
    clearFieldError(emailInput, emailError);
    return true;
}

/**
 * Validate phone field
 */
function validatePhone() {
    const phoneInput = document.getElementById('phone');
    const phoneSelect = document.getElementById('phoneSelect');
    const phoneError = document.getElementById('phoneError');
    
    const phone = phoneSelect.style.display === 'block' ? phoneSelect.value : phoneInput.value.trim();
    
    if (!phone) {
        const element = phoneSelect.style.display === 'block' ? phoneSelect : phoneInput;
        showFieldError(element, phoneError, 'Mobile number is required');
        return false;
    }
    
    // Basic phone validation - at least 10 digits
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
        const element = phoneSelect.style.display === 'block' ? phoneSelect : phoneInput;
        showFieldError(element, phoneError, 'Please enter a valid mobile number');
        return false;
    }
    
    const element = phoneSelect.style.display === 'block' ? phoneSelect : phoneInput;
    clearFieldError(element, phoneError);
    return true;
}

/**
 * Show field error
 */
function showFieldError(input, errorElement, message) {
    input.classList.add('error');
    errorElement.textContent = message;
}

/**
 * Clear field error
 */
function clearFieldError(input, errorElement) {
    input.classList.remove('error');
    errorElement.textContent = '';
}

/**
 * Handle order form submission
 */
async function handleOrderSubmission(e) {
    e.preventDefault();
    
    try {
        console.log('🚀 Processing order submission...');
        
        // Validate form
        const isEmailValid = validateEmail();
        const isPhoneValid = validatePhone();
        const termsCheck = document.getElementById('termsCheck');
        const termsError = document.getElementById('termsError');
        
        let isTermsValid = true;
        if (!termsCheck.checked) {
            termsError.textContent = 'Please accept the terms and conditions';
            isTermsValid = false;
        } else {
            termsError.textContent = '';
        }
        
        if (!isEmailValid || !isPhoneValid || !isTermsValid) {
            console.log('❌ Form validation failed');
            return;
        }
        
        // Show loading state
        showLoadingState();
        
        // Get form data
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const phoneSelect = document.getElementById('phoneSelect');
        
        const email = emailInput.value.trim();
        const phone = phoneSelect.style.display === 'block' ? phoneSelect.value : phoneInput.value.trim();
        
        // Initiate payment
        await initiatePayment({
            order_id: currentOrder.order_id,
            email: email,
            phone: phone
        });
        
    } catch (error) {
        console.error('❌ Order submission error:', error);
        hideLoadingState();
        showError('Failed to process order. Please try again.');
    }
}

/**
 * Initiate PayU payment
 */
async function initiatePayment(orderData) {
    try {
        console.log('💳 Initiating PayU payment...');
        
        const response = await fetch('/api/orders/initiate-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            throw new Error(`Payment initiation failed: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Payment data received:', result);
        
        // Redirect to PayU
        redirectToPayU(result.payment_data, result.payu_url);
        
    } catch (error) {
        console.error('❌ Payment initiation error:', error);
        hideLoadingState();
        showError('Failed to initiate payment. Please try again.');
    }
}

/**
 * Redirect to PayU payment gateway
 */
function redirectToPayU(paymentData, payuUrl) {
    try {
        console.log('🔄 Redirecting to PayU...');
        
        const payuForm = document.getElementById('payuForm');
        payuForm.action = payuUrl;
        
        // Clear existing form fields
        payuForm.innerHTML = '';
        
        // Add all payment data as hidden fields
        Object.keys(paymentData).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = paymentData[key];
            payuForm.appendChild(input);
        });
        
        // Store order info for return
        sessionStorage.setItem('currentOrderId', currentOrder.order_id);
        sessionStorage.setItem('paymentInitiated', 'true');
        
        // Submit form to PayU
        payuForm.submit();
        
        console.log('✅ Redirected to PayU payment gateway');
        
    } catch (error) {
        console.error('❌ PayU redirection error:', error);
        hideLoadingState();
        showError('Failed to redirect to payment gateway. Please try again.');
    }
}

/**
 * Show loading state
 */
function showLoadingState() {
    const payButton = document.getElementById('payButton');
    const payButtonText = document.getElementById('payButtonText');
    const payButtonLoader = document.getElementById('payButtonLoader');
    
    payButton.disabled = true;
    payButtonText.style.display = 'none';
    payButtonLoader.style.display = 'inline-block';
    payButton.classList.add('loading');
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const payButton = document.getElementById('payButton');
    const payButtonText = document.getElementById('payButtonText');
    const payButtonLoader = document.getElementById('payButtonLoader');
    
    payButton.disabled = false;
    payButtonText.style.display = 'inline';
    payButtonLoader.style.display = 'none';
    payButton.classList.remove('loading');
}

/**
 * Show error message
 */
function showError(message) {
    alert(message); // For now, using alert. Can be replaced with a custom modal
    console.error('❌ Error:', message);
}

// Export for debugging
window.debugOrderPage = {
    analysisData,
    contactInfo,
    currentOrder,
    createOrderWithContactExtraction,
    initiatePayment
};