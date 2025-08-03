# Email-Based Architecture for AI Resume Service

## 🏗️ **Architecture Overview**

This system implements an email-centric architecture where all user data and operations are keyed by email address extracted from uploaded resumes. This approach eliminates the need for account creation while maintaining cross-device continuity and secure access control.

## 📊 **Database Schema Summary**

### Core Tables (Email as Primary Key)

```sql
-- Main user profiles (email as PK)
user_profiles: email → profile_data + verification_status + payment_status

-- Uploaded files (linked by email)
resumes: id → email + file_metadata + processing_status

-- Analysis results (per resume)
resume_analysis: id → email + resume_id + ats_scores + detailed_analysis

-- AI improvements (access controlled)
resume_improvements: id → email + resume_id + improved_content + access_control

-- Payment tracking (per email)
payments: id → email + payment_data + stripe_integration

-- Email verification (magic links)
magic_links: id → email + token + verification_purpose

-- Security audit trail
activity_logs: id → email + action + timestamp + metadata
```

## 🔄 **Complete Backend Flow**

### **Step 1: Resume Upload & Initial Processing**

```
Frontend → Supabase Storage → Python API
```

**Frontend (JavaScript):**
```javascript
// 1. Upload file to Supabase storage
const fileUrl = await uploadFile(file);

// 2. Call analysis API
const response = await fetch('/api/cv-parser', {
    method: 'POST',
    body: JSON.stringify({ file_url: fileUrl })
});
```

**Backend (Python API):**
```python
# 1. Extract text from PDF/DOCX
content = extract_text_from_file(file_content, file_url)

# 2. Extract personal information (including email)
personal_info = extract_personal_information(content)
email = personal_info.get('email')

# 3. Perform ATS analysis
analysis_result = calculate_comprehensive_ats_score(content)
```

### **Step 2: Email-Based Data Pipeline**

```
Extract Email → Upsert Profile → Save Resume → Save Analysis → Log Activity
```

**Database Operations Sequence:**

```sql
-- 1. Create/Update User Profile
SELECT upsert_user_profile('user@example.com', {
    'full_name': 'John Doe',
    'phone': '+1234567890',
    'skills': ['Python', 'JavaScript'],
    'education': [...],
    'work_experience': [...]
});

-- 2. Save Resume Record
INSERT INTO resumes (email, file_url, processing_status)
VALUES ('user@example.com', 'https://...', 'processing')
RETURNING id;

-- 3. Save Analysis Results
INSERT INTO resume_analysis (
    email, resume_id, ats_score, detailed_analysis, ...
) VALUES (
    'user@example.com', resume_id, 85, {...}, ...
);

-- 4. Update Processing Status
UPDATE resumes 
SET processing_status = 'completed', analysis_completed = TRUE
WHERE id = resume_id;

-- 5. Log Activity
INSERT INTO activity_logs (email, action, resource_type, success)
VALUES ('user@example.com', 'resume_analysis', 'resume', TRUE);
```

### **Step 3: Payment & Access Control Flow**

```
Show Results → Payment Required → Stripe Integration → Access Granted
```

**Payment Workflow:**
```python
# 1. User wants premium features (AI-improved resume)
# 2. Create Stripe payment session
stripe_session = stripe.checkout.Session.create({
    'customer_email': extracted_email,
    'line_items': [{'price': 'price_premium_resume', 'quantity': 1}],
    'success_url': 'https://app.com/success',
    'metadata': {'email': extracted_email, 'resume_id': resume_id}
})

# 3. On successful payment webhook
payment_record = {
    'email': extracted_email,
    'amount_cents': 2900,  # $29.00
    'status': 'completed',
    'stripe_payment_intent_id': payment_intent.id
}
db.table('payments').insert(payment_record)

# 4. Update user profile
db.table('user_profiles').update({
    'has_paid': True,
    'payment_status': 'completed'
}).eq('email', extracted_email)
```

### **Step 4: Email Verification & Magic Links**

```
Payment Complete → Send Magic Link → Email Verification → Full Access
```

**Magic Link Flow:**
```python
# 1. Generate secure token
magic_token = uuid4()

# 2. Save magic link record
magic_link = {
    'email': extracted_email,
    'token': magic_token,
    'purpose': 'email_verification',
    'expires_at': datetime.now() + timedelta(hours=24)
}
db.table('magic_links').insert(magic_link)

# 3. Send email via Supabase Auth
supabase.auth.send_magic_link(
    email=extracted_email,
    redirect_to=f'https://app.com/verify?token={magic_token}'
)

# 4. On verification click
# Verify token, mark user as verified
db.table('user_profiles').update({
    'is_verified': True,
    'access_granted': True  # Both paid AND verified
}).eq('email', extracted_email)
```

### **Step 5: Controlled Access to AI Improvements**

```
Verified User → Generate AI Resume → Store Securely → Allow Download
```

**AI Resume Generation:**
```python
# 1. Check access permissions
user = db.table('user_profiles').select('*').eq('email', email).single()
if not (user.has_paid and user.is_verified):
    return {'error': 'Access denied - payment and verification required'}

# 2. Generate AI-improved resume
improved_content = ai_improve_resume(original_content, analysis_data)

# 3. Store with access control
improvement_record = {
    'email': email,
    'resume_id': resume_id,
    'improved_content': improved_content,
    'improved_score': new_ats_score,
    'downloadable': True,  # Only after payment + verification
    'ai_model': 'gpt-4'
}
db.table('resume_improvements').insert(improvement_record)

# 4. Generate secure download URL
download_url = generate_secure_download_url(improvement_record.id)
```

## 🔒 **Security & Privacy Implementation**

### **Email as PII Protection**
```sql
-- Encryption at rest (configured in Supabase)
-- Row Level Security policies
CREATE POLICY "Users access own data" ON user_profiles 
FOR ALL USING (email = auth.jwt() ->> 'email');

-- Data retention policies
-- GDPR compliance functions
CREATE FUNCTION anonymize_user_data(user_email TEXT) ...
```

### **Race Condition Prevention**
```sql
-- Unique constraints
CONSTRAINT unique_file_hash_per_email UNIQUE(email, file_hash);
CONSTRAINT unique_analysis_per_resume UNIQUE(resume_id);

-- Transaction isolation
BEGIN;
    -- All related operations in single transaction
    INSERT INTO user_profiles ...
    INSERT INTO resumes ...
    INSERT INTO resume_analysis ...
COMMIT;
```

### **Activity Logging & Audit Trail**
```python
def log_activity(email, action, resource_type=None, success=True, metadata=None):
    """Comprehensive audit logging for compliance"""
    activity_data = {
        'email': email,
        'action': action,  # resume_upload, payment, verification, download
        'resource_type': resource_type,
        'success': success,
        'ip_address': get_client_ip(),
        'user_agent': get_user_agent(),
        'metadata': metadata or {}
    }
    db.table('activity_logs').insert(activity_data)
```

## 🔄 **Cross-Device Continuity**

**How Multiple Devices Work:**
1. **Same Email, Any Device**: User uploads resume from Phone A
2. **Email Extraction**: System extracts `user@company.com`
3. **Database Linkage**: All data linked to this email
4. **Different Device Access**: User opens Laptop B, uploads different resume
5. **Same Email Recognition**: System recognizes `user@company.com`
6. **Unified Profile**: Both resumes appear in same account
7. **Payment Status**: Preserved across devices
8. **Magic Link Verification**: Works on any device

## 📱 **API Endpoints Summary**

```bash
# 1. Resume Upload & Analysis
POST /api/cv-parser
Body: { "file_url": "https://storage.../resume.pdf" }
Response: { "ats_score": 85, "email": "user@example.com", "resume_id": 123 }

# 2. Payment Intent
POST /api/payment/create-intent
Body: { "email": "user@example.com", "resume_id": 123 }
Response: { "client_secret": "pi_...", "session_url": "https://checkout.stripe.com/..." }

# 3. Magic Link Generation
POST /api/auth/send-magic-link
Body: { "email": "user@example.com", "purpose": "email_verification" }
Response: { "success": true, "message": "Verification email sent" }

# 4. Access Verification
GET /api/user/access-status?email=user@example.com
Response: { "has_paid": true, "is_verified": true, "access_granted": true }

# 5. Download AI Resume
GET /api/resume/download?email=user@example.com&resume_id=123
Headers: Authorization: Bearer <magic_link_token>
Response: [Secure file download or redirect]
```

## ⚡ **Performance Optimizations**

### **Database Indexes**
```sql
-- High-frequency query indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_resumes_email_status ON resumes(email, processing_status);
CREATE INDEX idx_payments_email_status ON payments(email, status);
CREATE INDEX idx_activity_logs_email_action ON activity_logs(email, action);
```

### **Caching Strategy**
```python
# Redis caching for user profiles
@cache_result(expiry=300)  # 5 minutes
def get_user_profile(email):
    return db.table('user_profiles').select('*').eq('email', email).single()

# File processing queue
# Background job processing for large files
```

## 🧪 **Testing Strategy**

### **Email Extraction Testing**
```python
def test_email_extraction():
    test_cases = [
        ("john.doe@company.com", "standard_resume.pdf"),
        ("jane+work@example.org", "complex_resume.docx"),
        ("no-email@test.com", "resume_without_email.pdf")
    ]
    
    for expected_email, test_file in test_cases:
        result = extract_personal_information(test_file)
        assert result['email'] == expected_email
```

### **Database Integration Testing**
```python
def test_email_based_workflow():
    # 1. Upload resume with specific email
    # 2. Verify profile creation
    # 3. Verify resume record
    # 4. Verify analysis saving
    # 5. Test payment flow
    # 6. Test verification flow
    # 7. Test access control
```

## 📋 **Production Deployment Checklist**

- [ ] **Database Migration**: Apply email-based schema
- [ ] **Environment Variables**: Supabase service role key
- [ ] **Stripe Integration**: Webhook endpoints configured
- [ ] **Email Service**: Magic link templates
- [ ] **Security**: RLS policies enabled
- [ ] **Monitoring**: Activity logs dashboard
- [ ] **Backup**: Automated database backups
- [ ] **GDPR**: Data export/deletion endpoints

## 🔮 **Future Enhancements**

1. **Multi-Language Support**: Email extraction from non-English resumes
2. **Bulk Processing**: Handle multiple resume uploads per email
3. **Team Accounts**: Support for HR teams with shared access
4. **API Rate Limiting**: Per-email usage limits
5. **Advanced Analytics**: Success metrics per email domain
6. **White-Label**: Custom branding per email domain

---

## 🎯 **Implementation Status**

✅ **Completed**:
- Email-based database schema
- CV text extraction with email parsing
- User profile upsert functions
- Resume and analysis saving
- Activity logging system

🔄 **In Progress**:
- Payment integration with Stripe
- Magic link email verification
- AI resume improvement generation
- Secure download system

📋 **Pending**:
- Frontend integration with new API
- Email template design
- Production deployment
- Performance optimization
- Security audit

This architecture provides a robust, scalable foundation for an email-centric AI resume service with strong security, cross-device continuity, and comprehensive audit trails.