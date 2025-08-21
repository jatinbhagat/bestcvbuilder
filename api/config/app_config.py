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