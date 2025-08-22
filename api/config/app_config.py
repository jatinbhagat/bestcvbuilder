"""
Application Configuration
Central configuration for app behavior including payment bypass
"""

# Payment Configuration
PAYMENT_CONFIG = {
    # Set to True to bypass payment and provide free CV fixes
    # Set to False to require payment for CV rewrite functionality
    'bypass_payment': True,
    
    # Free mode settings
    'free_mode_enabled': True,
    'free_rewrite_limit': None,  # None means unlimited, or set to a number like 3
    
    # Payment mode settings  
    'stripe_enabled': not True,  # Inverse of bypass_payment for clarity
    'payment_required_for_rewrite': not True
}

# Feature Flags
FEATURE_FLAGS = {
    'free_cv_rewrite': True,
    'payment_bypass': True,
    'unlimited_rewrites': True
}

def get_payment_config():
    """Get payment configuration"""
    return PAYMENT_CONFIG

def should_bypass_payment():
    """Check if payment should be bypassed"""
    return PAYMENT_CONFIG.get('bypass_payment', False)

def is_free_mode_enabled():
    """Check if free mode is enabled"""
    return PAYMENT_CONFIG.get('free_mode_enabled', False)

def get_feature_flag(flag_name):
    """Get a specific feature flag"""
    return FEATURE_FLAGS.get(flag_name, False)

# PayU Payment Gateway Configuration
PAYU_CONFIG = {
    # Production PayU credentials (replace with actual values)
    'merchant_id': 'YOUR_PRODUCTION_MID',  # Replace with actual MID
    'salt': 'YOUR_PRODUCTION_SALT',        # Replace with actual Salt
    'base_url': 'https://secure.payu.in',  # Production URL
    'success_url': '/payment-success',      # Relative URL for success
    'failure_url': '/payment-failure',      # Relative URL for failure
    'cancel_url': '/payment-cancel',        # Relative URL for cancel
    
    # Fixed payment details
    'amount': 99.00,
    'currency': 'INR',
    'product_info': 'BestCVBuilder - ATS Resume Optimization',
    'service_provider': 'payu_paisa',
    
    # Order ID configuration
    'order_prefix': 'BCVB',  # BestCVBuilder prefix
    'order_format': 'BCVB_%Y%m%d_%06d'  # Format: BCVB_YYYYMMDD_NNNNNN
}

def get_payu_config():
    """Get PayU configuration"""
    return PAYU_CONFIG