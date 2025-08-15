-- Add LLM calls tracking table for grammar and spelling checks
-- This table stores all LLM API calls for analysis and cost tracking

CREATE TABLE IF NOT EXISTS public.llm_calls (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(320) DEFAULT NULL, -- For non-authenticated users
    session_uuid VARCHAR(100) DEFAULT NULL, -- Session tracking
    
    -- Call metadata
    call_type VARCHAR(50) NOT NULL, -- 'grammar_check', 'spelling_check', 'cv_rewrite', etc.
    model_used VARCHAR(100) NOT NULL, -- 'gemini-flash', 'gemini-pro', etc.
    
    -- Request data
    input_text_length INTEGER NOT NULL,
    input_text_hash VARCHAR(64) NOT NULL, -- SHA256 hash for deduplication
    prompt_template TEXT NOT NULL, -- The prompt template used
    
    -- Response data
    llm_response_raw TEXT, -- Raw LLM response
    llm_response_parsed JSONB, -- Parsed/structured response
    
    -- Scoring results
    grammar_score INTEGER DEFAULT NULL CHECK (grammar_score >= 0 AND grammar_score <= 10),
    spelling_score INTEGER DEFAULT NULL CHECK (spelling_score >= 0 AND spelling_score <= 10),
    
    -- Cost tracking
    estimated_cost_usd DECIMAL(10,6) DEFAULT 0.000000,
    tokens_used INTEGER DEFAULT 0,
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'failed', 'timeout'
    error_message TEXT DEFAULT NULL,
    processing_time_ms INTEGER DEFAULT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_call_type CHECK (call_type IN ('grammar_check', 'spelling_check', 'cv_rewrite', 'cv_optimization')),
    CONSTRAINT valid_status CHECK (status IN ('completed', 'failed', 'timeout')),
    CONSTRAINT user_or_email_required CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_llm_calls_user_id ON public.llm_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_calls_email ON public.llm_calls(email);
CREATE INDEX IF NOT EXISTS idx_llm_calls_call_type ON public.llm_calls(call_type);
CREATE INDEX IF NOT EXISTS idx_llm_calls_created_at ON public.llm_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_calls_input_hash ON public.llm_calls(input_text_hash);
CREATE INDEX IF NOT EXISTS idx_llm_calls_session_uuid ON public.llm_calls(session_uuid);

-- Enable Row Level Security
ALTER TABLE public.llm_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for llm_calls
CREATE POLICY "Users can view own LLM calls" ON public.llm_calls
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own LLM calls" ON public.llm_calls
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can access all LLM calls for analytics
CREATE POLICY "Service role can access all LLM calls" ON public.llm_calls
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON public.llm_calls TO anon, authenticated;
GRANT ALL ON SEQUENCE public.llm_calls_id_seq TO anon, authenticated;

-- Function to get LLM usage statistics
CREATE OR REPLACE FUNCTION public.get_llm_usage_stats(user_uuid UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_calls', COUNT(*),
        'total_cost_usd', COALESCE(SUM(estimated_cost_usd), 0),
        'grammar_checks', COUNT(*) FILTER (WHERE call_type = 'grammar_check'),
        'spelling_checks', COUNT(*) FILTER (WHERE call_type = 'spelling_check'),
        'avg_grammar_score', AVG(grammar_score) FILTER (WHERE grammar_score IS NOT NULL),
        'avg_spelling_score', AVG(spelling_score) FILTER (WHERE spelling_score IS NOT NULL),
        'success_rate', (COUNT(*) FILTER (WHERE status = 'completed')::FLOAT / COUNT(*) * 100),
        'last_call', MAX(created_at)
    ) INTO result
    FROM public.llm_calls
    WHERE (user_uuid IS NULL OR user_id = user_uuid)
    AND created_at >= NOW() - INTERVAL '30 days'; -- Last 30 days
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_llm_usage_stats TO anon, authenticated;