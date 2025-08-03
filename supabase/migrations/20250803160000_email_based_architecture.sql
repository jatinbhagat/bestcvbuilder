-- Email-Based Architecture Migration for AI Resume Service
-- All tables use email as primary/foreign key for simplified user management

-- Drop existing tables that use UUID-based structure
DROP TABLE IF EXISTS analysis_results CASCADE;
DROP TABLE IF EXISTS cv_rewrites CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 1. User Profiles Table (email as primary key)
CREATE TABLE user_profiles (
    email VARCHAR(320) PRIMARY KEY, -- RFC 5321 max email length
    full_name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    professional_summary TEXT,
    years_of_experience INTEGER,
    skills JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    work_experience JSONB DEFAULT '[]'::jsonb,
    
    -- Email verification and status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token UUID DEFAULT gen_random_uuid(),
    verification_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment and access control
    has_paid BOOLEAN DEFAULT FALSE,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    access_granted BOOLEAN DEFAULT FALSE, -- Only true when both paid AND verified
    
    -- Privacy and security
    data_source VARCHAR(50) DEFAULT 'cv_extracted', -- cv_extracted, manual_entry, api_import
    consent_given BOOLEAN DEFAULT TRUE,
    privacy_policy_accepted BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR length(phone) >= 10),
    CONSTRAINT valid_experience CHECK (years_of_experience IS NULL OR years_of_experience >= 0)
);

-- 2. Resumes Table (stores uploaded files, linked by email)
CREATE TABLE resumes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL REFERENCES user_profiles(email) ON DELETE CASCADE,
    
    -- File information
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Supabase storage path
    file_url TEXT NOT NULL, -- Public URL for processing
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- pdf, docx, doc
    file_hash VARCHAR(64), -- SHA-256 for duplicate detection
    
    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, processing, completed, failed
    extraction_completed BOOLEAN DEFAULT FALSE,
    analysis_completed BOOLEAN DEFAULT FALSE,
    
    -- Upload metadata
    upload_source VARCHAR(50) DEFAULT 'web_app', -- web_app, api, mobile_app
    user_agent TEXT,
    ip_address INET,
    
    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760), -- 10MB limit
    CONSTRAINT valid_file_type CHECK (file_type IN ('pdf', 'docx', 'doc')),
    CONSTRAINT unique_file_hash_per_email UNIQUE(email, file_hash)
);

-- 3. Resume Analysis Results Table (ATS scores and analysis data)
CREATE TABLE resume_analysis (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL REFERENCES user_profiles(email) ON DELETE CASCADE,
    resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    
    -- ATS Analysis Results
    ats_score INTEGER NOT NULL CHECK (ats_score >= 0 AND ats_score <= 100),
    score_category VARCHAR(20) NOT NULL CHECK (score_category IN ('excellent', 'good', 'fair', 'poor', 'very_poor')),
    
    -- Component Scores
    structure_score INTEGER CHECK (structure_score >= 0 AND structure_score <= 25),
    keywords_score INTEGER CHECK (keywords_score >= 0 AND keywords_score <= 20),
    contact_score INTEGER CHECK (contact_score >= 0 AND contact_score <= 15),
    formatting_score INTEGER CHECK (formatting_score >= 0 AND formatting_score <= 20),
    achievements_score INTEGER CHECK (achievements_score >= 0 AND achievements_score <= 10),
    readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 10),
    
    -- Detailed Analysis Data
    strengths JSONB DEFAULT '[]'::jsonb,
    improvements JSONB DEFAULT '[]'::jsonb,
    missing_keywords JSONB DEFAULT '[]'::jsonb,
    found_keywords JSONB DEFAULT '[]'::jsonb,
    detailed_analysis JSONB DEFAULT '{}'::jsonb,
    recommendations JSONB DEFAULT '{}'::jsonb,
    
    -- Industry and Context
    detected_industry VARCHAR(100),
    analysis_version VARCHAR(20) DEFAULT '1.0',
    
    -- Timestamps
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_analysis_per_resume UNIQUE(resume_id),
    CONSTRAINT valid_total_score CHECK (
        COALESCE(structure_score, 0) + COALESCE(keywords_score, 0) + 
        COALESCE(contact_score, 0) + COALESCE(formatting_score, 0) + 
        COALESCE(achievements_score, 0) + COALESCE(readability_score, 0) <= 100
    )
);

-- 4. AI-Generated Resume Improvements Table
CREATE TABLE resume_improvements (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL REFERENCES user_profiles(email) ON DELETE CASCADE,
    resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    analysis_id INTEGER NOT NULL REFERENCES resume_analysis(id) ON DELETE CASCADE,
    
    -- Improved Resume Data
    improved_content TEXT NOT NULL, -- AI-generated improved resume content
    improved_score INTEGER CHECK (improved_score >= 0 AND improved_score <= 100),
    score_improvement INTEGER CHECK (score_improvement >= 0),
    
    -- Generation Metadata
    ai_model VARCHAR(100) DEFAULT 'gpt-4',
    generation_tokens INTEGER,
    processing_time_seconds DECIMAL(10,2),
    
    -- File Storage
    improved_file_path TEXT, -- Supabase storage path for generated file
    improved_file_url TEXT, -- Download URL (only accessible after payment + verification)
    
    -- Access Control
    downloadable BOOLEAN DEFAULT FALSE, -- Only true after payment + verification
    download_count INTEGER DEFAULT 0,
    last_downloaded TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_improvement_per_analysis UNIQUE(analysis_id)
);

-- 5. Payments Table (payment tracking per email)
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL REFERENCES user_profiles(email) ON DELETE CASCADE,
    
    -- Payment Details
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50), -- stripe, paypal, etc.
    
    -- Payment Gateway Data
    stripe_payment_intent_id VARCHAR(255),
    stripe_session_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Status and Verification
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, refunded
    verified BOOLEAN DEFAULT FALSE,
    
    -- Product Information
    product_type VARCHAR(50) DEFAULT 'resume_improvement', -- resume_improvement, premium_analysis
    resume_id INTEGER REFERENCES resumes(id),
    
    -- Refund Information
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_currency CHECK (currency IN ('USD', 'EUR', 'GBP')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded'))
);

-- 6. Magic Link Authentication Table (for email verification)
CREATE TABLE magic_links (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL REFERENCES user_profiles(email) ON DELETE CASCADE,
    
    -- Magic Link Data
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    purpose VARCHAR(50) NOT NULL, -- email_verification, password_reset, login
    
    -- Security
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    
    -- Tracking
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    send_count INTEGER DEFAULT 1,
    last_send_attempt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_purpose CHECK (purpose IN ('email_verification', 'password_reset', 'login')),
    CONSTRAINT unique_active_token_per_email_purpose UNIQUE(email, purpose, used),
    CONSTRAINT future_expiry CHECK (expires_at > CURRENT_TIMESTAMP)
);

-- 7. Activity Logs Table (audit trail for security)
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) REFERENCES user_profiles(email) ON DELETE SET NULL,
    
    -- Activity Details
    action VARCHAR(100) NOT NULL, -- upload, analyze, payment, verification, download
    resource_type VARCHAR(50), -- resume, payment, analysis
    resource_id INTEGER,
    
    -- Request Context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Results
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_action CHECK (action IN (
        'resume_upload', 'resume_analysis', 'payment_initiated', 'payment_completed',
        'email_verification_sent', 'email_verified', 'resume_download', 'profile_update'
    ))
);

-- Create Indexes for Performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_verification ON user_profiles(is_verified, has_paid);
CREATE INDEX idx_resumes_email ON resumes(email);
CREATE INDEX idx_resumes_status ON resumes(processing_status);
CREATE INDEX idx_resumes_upload_date ON resumes(uploaded_at);
CREATE INDEX idx_resume_analysis_email ON resume_analysis(email);
CREATE INDEX idx_resume_analysis_score ON resume_analysis(ats_score);
CREATE INDEX idx_payments_email ON payments(email);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_email_purpose ON magic_links(email, purpose);
CREATE INDEX idx_activity_logs_email_action ON activity_logs(email, action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Row Level Security Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Security Policies (email-based access control)
-- Users can only access their own data based on email
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (email = auth.jwt() ->> 'email');
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can view own resumes" ON resumes FOR SELECT USING (email = auth.jwt() ->> 'email');
CREATE POLICY "Users can insert own resumes" ON resumes FOR INSERT WITH CHECK (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can view own analysis" ON resume_analysis FOR SELECT USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can view own improvements" ON resume_improvements FOR SELECT USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (email = auth.jwt() ->> 'email');

-- Functions for Business Logic
CREATE OR REPLACE FUNCTION update_user_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_timestamp 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_profile_timestamp();

-- Function to check if user has full access (paid + verified)
CREATE OR REPLACE FUNCTION user_has_full_access(user_email VARCHAR(320))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE email = user_email 
        AND has_paid = TRUE 
        AND is_verified = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to safely create or update user profile
CREATE OR REPLACE FUNCTION upsert_user_profile(
    p_email VARCHAR(320),
    p_profile_data JSONB
)
RETURNS user_profiles AS $$
DECLARE
    result user_profiles;
BEGIN
    -- Insert or update user profile
    INSERT INTO user_profiles (email, full_name, phone, address, city, state, linkedin_url, github_url, professional_summary, years_of_experience, skills, education, work_experience)
    VALUES (
        p_email,
        p_profile_data->>'full_name',
        p_profile_data->>'phone', 
        p_profile_data->>'address',
        p_profile_data->>'city',
        p_profile_data->>'state',
        p_profile_data->>'linkedin_url',
        p_profile_data->>'github_url',
        p_profile_data->>'professional_summary',
        (p_profile_data->>'years_of_experience')::INTEGER,
        COALESCE(p_profile_data->'skills', '[]'::jsonb),
        COALESCE(p_profile_data->'education', '[]'::jsonb),
        COALESCE(p_profile_data->'work_experience', '[]'::jsonb)
    )
    ON CONFLICT (email) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
        address = COALESCE(EXCLUDED.address, user_profiles.address),
        city = COALESCE(EXCLUDED.city, user_profiles.city),
        state = COALESCE(EXCLUDED.state, user_profiles.state),
        linkedin_url = COALESCE(EXCLUDED.linkedin_url, user_profiles.linkedin_url),
        github_url = COALESCE(EXCLUDED.github_url, user_profiles.github_url),
        professional_summary = COALESCE(EXCLUDED.professional_summary, user_profiles.professional_summary),
        years_of_experience = COALESCE(EXCLUDED.years_of_experience, user_profiles.years_of_experience),
        skills = CASE 
            WHEN EXCLUDED.skills != '[]'::jsonb THEN EXCLUDED.skills 
            ELSE user_profiles.skills 
        END,
        education = CASE 
            WHEN EXCLUDED.education != '[]'::jsonb THEN EXCLUDED.education 
            ELSE user_profiles.education 
        END,
        work_experience = CASE 
            WHEN EXCLUDED.work_experience != '[]'::jsonb THEN EXCLUDED.work_experience 
            ELSE user_profiles.work_experience 
        END,
        updated_at = CURRENT_TIMESTAMP
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comments for Documentation
COMMENT ON TABLE user_profiles IS 'Email-based user profiles with extracted CV data and verification status';
COMMENT ON TABLE resumes IS 'Uploaded resume files linked to user emails';
COMMENT ON TABLE resume_analysis IS 'ATS analysis results for uploaded resumes';
COMMENT ON TABLE resume_improvements IS 'AI-generated resume improvements (access controlled)';
COMMENT ON TABLE payments IS 'Payment records for premium features';
COMMENT ON TABLE magic_links IS 'Email verification and authentication tokens';
COMMENT ON TABLE activity_logs IS 'Audit trail for security and compliance';

COMMENT ON COLUMN user_profiles.email IS 'Primary key - user email address (PII)';
COMMENT ON COLUMN user_profiles.access_granted IS 'True only when both paid AND email verified';
COMMENT ON COLUMN resume_improvements.downloadable IS 'Controlled access flag - only true after payment + verification';
COMMENT ON COLUMN magic_links.token IS 'Secure UUID token for email verification links';