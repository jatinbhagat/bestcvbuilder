# Payment Bypass Configuration

This system allows toggling between free mode and paid mode for CV rewrite functionality.

## Configuration

Edit `/api/config/app_config.py`:

```python
PAYMENT_CONFIG = {
    'bypass_payment': True,        # Set to True for free mode, False for paid mode
    'free_mode_enabled': True,     # Enable free CV rewrites
    'free_rewrite_limit': None,    # None = unlimited, or set to number (e.g., 3)
}
```

## API Endpoints

### Configuration API
- **GET** `/api/config/` - Returns current app configuration
- Used by frontend to determine if payment should be bypassed

### CV Rewrite API  
- **POST** `/api/cv-rewrite/` - Process CV rewrite
- Checks bypass configuration automatically
- Returns `payment_bypassed: true` when bypass is active

## Frontend Behavior

### When `bypass_payment = true`:
- "Fix for Free" CTAs bypass payment screen
- Directly call CV rewrite API
- Redirect to success page with results

### When `bypass_payment = false`:
- CTAs redirect to payment.html
- Payment required before CV rewrite
- Standard Stripe payment flow

## How to Toggle

**Enable Free Mode:**
```python
'bypass_payment': True,
'free_mode_enabled': True,
```

**Enable Payment Mode:**
```python
'bypass_payment': False,
'free_mode_enabled': False,
```

## Testing

Test config API:
```bash
cd api/config && python index.py
```

Test CV rewrite with bypass:
```bash
cd api/cv-rewrite && python index.py
```

## Frontend Integration

The frontend automatically:
1. Fetches config from `/api/config/` on page load
2. Checks `bypass_payment` flag when CTAs are clicked
3. Either processes directly or redirects to payment

Both main CTA button and modal "Fix for Free" buttons use the same bypass logic.