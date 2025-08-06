-- Add job_analysis table for BestCVBuilder job description analysis functionality
-- This migration adds support for job analysis feature after payment success

-- Job analysis table
CREATE TABLE IF NOT EXISTS public.job_analysis (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_title TEXT NOT NULL,
    company_name TEXT,
    job_description TEXT NOT NULL,
    extracted_requirements JSONB,
    user_expectations JSONB,
    analysis_score INTEGER DEFAULT 0 CHECK (analysis_score >= 0 AND analysis_score <= 100),
    matching_keywords TEXT[],
    priority_skills TEXT[],
    experience_level TEXT,
    job_type TEXT,
    processing_info JSONB,
    session_uuid TEXT, -- For anonymous users
    email_used TEXT, -- Track which email was used (temp or real)
    is_temporary_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CV optimization table (links job analysis to resume improvements)
CREATE TABLE IF NOT EXISTS public.cv_optimizations (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_analysis_id INTEGER REFERENCES public.job_analysis(id) ON DELETE CASCADE,
    original_analysis_id INTEGER REFERENCES public.resume_analysis(id) ON DELETE CASCADE,
    payment_id INTEGER REFERENCES public.payments(id) ON DELETE CASCADE,
    original_score INTEGER NOT NULL,
    optimized_score INTEGER,
    score_improvement INTEGER,
    optimized_resume_url TEXT,
    optimization_data JSONB,
    optimization_notes TEXT,
    session_uuid TEXT, -- For anonymous users
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_analysis_user_id ON public.job_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_job_analysis_session_uuid ON public.job_analysis(session_uuid);
CREATE INDEX IF NOT EXISTS idx_job_analysis_created_at ON public.job_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_job_analysis_role_title ON public.job_analysis(role_title);
CREATE INDEX IF NOT EXISTS idx_job_analysis_company_name ON public.job_analysis(company_name);

CREATE INDEX IF NOT EXISTS idx_cv_optimizations_user_id ON public.cv_optimizations(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_optimizations_job_analysis_id ON public.cv_optimizations(job_analysis_id);
CREATE INDEX IF NOT EXISTS idx_cv_optimizations_session_uuid ON public.cv_optimizations(session_uuid);
CREATE INDEX IF NOT EXISTS idx_cv_optimizations_created_at ON public.cv_optimizations(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.job_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_optimizations ENABLE ROW LEVEL SECURITY;

-- Job analysis policies - users can only access their own data
CREATE POLICY "Users can view own job analysis" ON public.job_analysis
    FOR SELECT USING (
        auth.uid() = user_id 
        OR (user_id IS NULL AND session_uuid IS NOT NULL)
    );

CREATE POLICY "Users can insert own job analysis" ON public.job_analysis
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR (user_id IS NULL AND session_uuid IS NOT NULL)
    );

CREATE POLICY "Users can update own job analysis" ON public.job_analysis
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR (user_id IS NULL AND session_uuid IS NOT NULL)
    );

-- CV optimizations policies
CREATE POLICY "Users can view own cv optimizations" ON public.cv_optimizations
    FOR SELECT USING (
        auth.uid() = user_id 
        OR (user_id IS NULL AND session_uuid IS NOT NULL)
    );

CREATE POLICY "Users can insert own cv optimizations" ON public.cv_optimizations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR (user_id IS NULL AND session_uuid IS NOT NULL)
    );

CREATE POLICY "Users can update own cv optimizations" ON public.cv_optimizations
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR (user_id IS NULL AND session_uuid IS NOT NULL)
    );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_analysis_updated_at 
    BEFORE UPDATE ON public.job_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to save job analysis data (returns INTEGER to match table ID type)
CREATE OR REPLACE FUNCTION public.save_job_analysis_data(
    p_email TEXT,
    p_role_title TEXT,
    p_company_name TEXT,
    p_job_description TEXT,
    p_extracted_requirements JSONB,
    p_user_expectations JSONB,
    p_analysis_score INTEGER,
    p_matching_keywords TEXT[],
    p_priority_skills TEXT[],
    p_experience_level TEXT,
    p_job_type TEXT,
    p_processing_info JSONB,
    p_session_uuid TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    job_analysis_id INTEGER;
    target_user_id UUID;
BEGIN
    -- Get user ID from email or use NULL for anonymous
    IF p_email LIKE '%@bestcvbuilder.com' THEN
        target_user_id := NULL;
    ELSE
        SELECT id INTO target_user_id FROM public.user_profiles WHERE email = p_email LIMIT 1;
    END IF;
    
    INSERT INTO public.job_analysis (
        user_id, role_title, company_name, job_description,
        extracted_requirements, user_expectations, analysis_score,
        matching_keywords, priority_skills, experience_level, job_type,
        processing_info, session_uuid, email_used, is_temporary_email
    ) VALUES (
        target_user_id, p_role_title, p_company_name, p_job_description,
        p_extracted_requirements, p_user_expectations, p_analysis_score,
        p_matching_keywords, p_priority_skills, p_experience_level, p_job_type,
        p_processing_info, p_session_uuid, p_email, p_email LIKE '%@bestcvbuilder.com'
    ) RETURNING id INTO job_analysis_id;
    
    RETURN job_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user job analysis history
CREATE OR REPLACE FUNCTION public.get_user_job_analysis_history(user_uuid UUID)
RETURNS TABLE (
    id INTEGER,
    role_title TEXT,
    company_name TEXT,
    analysis_score INTEGER,
    experience_level TEXT,
    job_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ja.id,
        ja.role_title,
        ja.company_name,
        ja.analysis_score,
        ja.experience_level,
        ja.job_type,
        ja.created_at
    FROM public.job_analysis ja
    WHERE ja.user_id = user_uuid
    ORDER BY ja.created_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get job analysis stats
CREATE OR REPLACE FUNCTION public.get_job_analysis_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_job_analyses', COUNT(ja.id),
        'total_optimizations', COUNT(co.id),
        'average_job_score', AVG(ja.analysis_score),
        'best_job_score', MAX(ja.analysis_score),
        'most_common_job_type', MODE() WITHIN GROUP (ORDER BY ja.job_type),
        'most_common_experience_level', MODE() WITHIN GROUP (ORDER BY ja.experience_level),
        'last_job_analysis', MAX(ja.created_at)
    ) INTO result
    FROM public.job_analysis ja
    LEFT JOIN public.cv_optimizations co ON ja.id = co.job_analysis_id
    WHERE ja.user_id = user_uuid
    GROUP BY ja.user_id;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON public.job_analysis TO anon, authenticated;
GRANT ALL ON public.cv_optimizations TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_job_analysis_data TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_job_analysis_history TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_analysis_stats TO anon, authenticated;