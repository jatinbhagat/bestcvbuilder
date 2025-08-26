/**
 * Payment Redirect - Legacy Stripe to PayU Migration
 * This file redirects users from the old Stripe payment flow to the new PayU flow
 */

console.log('🔄 Redirecting from legacy payment flow to PayU payment flow...');

// Show loading message briefly, then redirect
const showLoadingAndRedirect = () => {
    // Add loading message to the page if elements exist
    const container = document.querySelector('main') || document.querySelector('.container') || document.body;
    
    if (container) {
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50';
        loadingMessage.innerHTML = `
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-600">Redirecting to payment...</p>
            </div>
        `;
        document.body.appendChild(loadingMessage);
    }
    
    // Redirect after a brief delay
    setTimeout(() => {
        window.location.href = './create-order.html';
    }, 500);
};

// Execute when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showLoadingAndRedirect);
} else {
    showLoadingAndRedirect();
}