-- Fix activity_logs table schema
-- Add missing activity_data column that the frontend expects

-- Check if activity_logs table exists, if not create it
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID DEFAULT NULL,
    email VARCHAR(320) DEFAULT NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB DEFAULT NULL, -- This is the missing column
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    session_uuid VARCHAR(100) DEFAULT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- If the table already exists, add the missing column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs' 
        AND column_name = 'activity_data'
    ) THEN
        ALTER TABLE activity_logs ADD COLUMN activity_data JSONB DEFAULT NULL;
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_email ON activity_logs(email);