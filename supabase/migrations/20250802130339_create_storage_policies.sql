-- Create storage policies for public access to resumes bucket

-- Create the resumes bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public uploads to resumes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from resumes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to resumes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from resumes bucket" ON storage.objects;

-- Allow anyone to upload to the resumes bucket
CREATE POLICY "Allow public uploads to resumes bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'resumes');

-- Allow anyone to read from the resumes bucket (for public URLs)
CREATE POLICY "Allow public reads from resumes bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'resumes');

-- Allow anyone to update files in the resumes bucket (for upsert functionality)
CREATE POLICY "Allow public updates to resumes bucket" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');

-- Allow anyone to delete from the resumes bucket (for cleanup)
CREATE POLICY "Allow public deletes from resumes bucket" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'resumes');