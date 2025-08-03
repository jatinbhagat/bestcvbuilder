-- Add UUID to Email mapping support for CVs without email addresses
-- This maintains email-centric architecture while handling edge cases

-- 1. Add UUID mapping table for email-less CVs
CREATE TABLE email_uuid_mappings (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL REFERENCES user_profiles(email) ON DELETE CASCADE,
    is_temporary BOOLEAN DEFAULT FALSE, -- TRUE for generated emails like [uuid]@bestcvbuilder.com
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_uuid_email UNIQUE(uuid, email),
    CONSTRAINT valid_temp_email CHECK (
        NOT is_temporary OR email LIKE '%@bestcvbuilder.com'
    )
);

-- 2. Add session_uuid column to user_profiles for temporary identification
ALTER TABLE user_profiles 
ADD COLUMN session_uuid UUID DEFAULT gen_random_uuid(),
ADD COLUMN email_source VARCHAR(50) DEFAULT 'cv_extracted' CHECK (
    email_source IN ('cv_extracted', 'generated_temp', 'user_provided', 'api_import')
);

-- 3. Add session_uuid to other tables for better tracking
ALTER TABLE resumes 
ADD COLUMN session_uuid UUID,
ADD COLUMN email_source VARCHAR(50) DEFAULT 'cv_extracted';

ALTER TABLE resume_analysis 
ADD COLUMN session_uuid UUID;

ALTER TABLE activity_logs 
ADD COLUMN session_uuid UUID;

-- 4. Create indexes for UUID lookups
CREATE INDEX idx_email_uuid_mappings_uuid ON email_uuid_mappings(uuid);
CREATE INDEX idx_email_uuid_mappings_email ON email_uuid_mappings(email);
CREATE INDEX idx_user_profiles_session_uuid ON user_profiles(session_uuid);
CREATE INDEX idx_resumes_session_uuid ON resumes(session_uuid);

-- 5. Function to generate temporary email from UUID
CREATE OR REPLACE FUNCTION generate_temp_email_from_uuid(p_uuid UUID)
RETURNS VARCHAR(320) AS $$
BEGIN
    -- Generate email like: a1b2c3d4-e5f6-7890-abcd-ef1234567890@bestcvbuilder.com
    RETURN LOWER(p_uuid::TEXT) || '@bestcvbuilder.com';
END;
$$ LANGUAGE plpgsql;

-- 6. Enhanced upsert function that handles both real and temp emails
CREATE OR REPLACE FUNCTION upsert_user_profile_with_uuid(
    p_email VARCHAR(320),
    p_session_uuid UUID,
    p_profile_data JSONB,
    p_email_source VARCHAR(50) DEFAULT 'cv_extracted'
)
RETURNS user_profiles AS $$
DECLARE
    result user_profiles;
    temp_email VARCHAR(320);
BEGIN
    -- If no email provided, generate temporary email
    IF p_email IS NULL OR p_email = '' THEN
        temp_email := generate_temp_email_from_uuid(p_session_uuid);
        p_email_source := 'generated_temp';
    ELSE
        temp_email := p_email;
    END IF;
    
    -- Insert or update user profile
    INSERT INTO user_profiles (
        email, session_uuid, email_source,
        full_name, phone, address, city, state, 
        linkedin_url, github_url, professional_summary, 
        years_of_experience, skills, education, work_experience
    )
    VALUES (
        temp_email,
        p_session_uuid,
        p_email_source,
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
        session_uuid = COALESCE(EXCLUDED.session_uuid, user_profiles.session_uuid),
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
    
    -- Create UUID mapping record if it's a temporary email
    IF p_email_source = 'generated_temp' THEN
        INSERT INTO email_uuid_mappings (uuid, email, is_temporary)
        VALUES (p_session_uuid, temp_email, TRUE)
        ON CONFLICT (uuid, email) DO NOTHING;
    ELSE
        -- Create mapping for real emails too (for consistency)
        INSERT INTO email_uuid_mappings (uuid, email, is_temporary)
        VALUES (p_session_uuid, temp_email, FALSE)
        ON CONFLICT (uuid, email) DO NOTHING;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to upgrade temporary email to real email when user provides it
CREATE OR REPLACE FUNCTION upgrade_temp_email_to_real(
    p_session_uuid UUID,
    p_real_email VARCHAR(320)
)
RETURNS BOOLEAN AS $$
DECLARE
    old_temp_email VARCHAR(320);
    temp_profile user_profiles;
BEGIN
    -- Find the temporary email for this UUID
    SELECT email INTO old_temp_email 
    FROM user_profiles 
    WHERE session_uuid = p_session_uuid 
    AND email_source = 'generated_temp';
    
    IF old_temp_email IS NULL THEN
        RETURN FALSE; -- No temporary profile found
    END IF;
    
    -- Get the full profile data
    SELECT * INTO temp_profile FROM user_profiles WHERE email = old_temp_email;
    
    -- Create new profile with real email
    INSERT INTO user_profiles (
        email, session_uuid, email_source,
        full_name, phone, address, city, state,
        linkedin_url, github_url, professional_summary,
        years_of_experience, skills, education, work_experience,
        has_paid, is_verified, access_granted
    ) VALUES (
        p_real_email, p_session_uuid, 'user_provided',
        temp_profile.full_name, temp_profile.phone, temp_profile.address,
        temp_profile.city, temp_profile.state, temp_profile.linkedin_url,
        temp_profile.github_url, temp_profile.professional_summary,
        temp_profile.years_of_experience, temp_profile.skills,
        temp_profile.education, temp_profile.work_experience,
        temp_profile.has_paid, temp_profile.is_verified, temp_profile.access_granted
    ) ON CONFLICT (email) DO UPDATE SET
        session_uuid = EXCLUDED.session_uuid,
        -- Merge data from temporary profile
        full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
        phone = COALESCE(user_profiles.phone, EXCLUDED.phone),
        updated_at = CURRENT_TIMESTAMP;
    
    -- Update all related records to use the new email
    UPDATE resumes SET email = p_real_email WHERE email = old_temp_email;
    UPDATE resume_analysis SET email = p_real_email WHERE email = old_temp_email;
    UPDATE resume_improvements SET email = p_real_email WHERE email = old_temp_email;
    UPDATE payments SET email = p_real_email WHERE email = old_temp_email;
    UPDATE magic_links SET email = p_real_email WHERE email = old_temp_email;
    UPDATE activity_logs SET email = p_real_email WHERE email = old_temp_email;
    
    -- Update UUID mapping
    UPDATE email_uuid_mappings 
    SET email = p_real_email, is_temporary = FALSE
    WHERE uuid = p_session_uuid AND email = old_temp_email;
    
    -- Delete the temporary profile
    DELETE FROM user_profiles WHERE email = old_temp_email;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to find user by either email or UUID
CREATE OR REPLACE FUNCTION find_user_by_email_or_uuid(
    p_email VARCHAR(320) DEFAULT NULL,
    p_uuid UUID DEFAULT NULL
)
RETURNS user_profiles AS $$
DECLARE
    result user_profiles;
    resolved_email VARCHAR(320);
BEGIN
    -- If email provided, use it directly
    IF p_email IS NOT NULL THEN
        SELECT * INTO result FROM user_profiles WHERE email = p_email;
        RETURN result;
    END IF;
    
    -- If UUID provided, find the associated email
    IF p_uuid IS NOT NULL THEN
        SELECT email INTO resolved_email 
        FROM email_uuid_mappings 
        WHERE uuid = p_uuid;
        
        IF resolved_email IS NOT NULL THEN
            SELECT * INTO result FROM user_profiles WHERE email = resolved_email;
            RETURN result;
        END IF;
    END IF;
    
    -- Return null if neither found
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Comments for documentation
COMMENT ON TABLE email_uuid_mappings IS 'Maps UUIDs to emails for session tracking and temp email support';
COMMENT ON COLUMN user_profiles.session_uuid IS 'UUID for session tracking, especially useful for temporary emails';
COMMENT ON COLUMN user_profiles.email_source IS 'Source of email: cv_extracted, generated_temp, user_provided, api_import';
COMMENT ON FUNCTION generate_temp_email_from_uuid IS 'Generates temporary email address from UUID for CVs without email';
COMMENT ON FUNCTION upgrade_temp_email_to_real IS 'Migrates temporary email profile to real email when user provides it';

-- 10. Row Level Security for new tables
ALTER TABLE email_uuid_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own UUID mappings" ON email_uuid_mappings 
FOR SELECT USING (email = auth.jwt() ->> 'email');

-- 11. Update existing policies to handle session_uuid
CREATE POLICY "Users can access by session UUID" ON user_profiles 
FOR SELECT USING (
    email = auth.jwt() ->> 'email' OR 
    session_uuid = (auth.jwt() ->> 'session_uuid')::UUID
);