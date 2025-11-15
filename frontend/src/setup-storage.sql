-- Setup Supabase Storage bucket for report files
-- Run this in the Supabase SQL Editor or via migration

-- Create the 'reports' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false, -- Private bucket
  10485760, -- 10MB max file size
  ARRAY['application/json']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own reports
CREATE POLICY "Users can upload their own reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own reports
CREATE POLICY "Users can read their own reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own reports
CREATE POLICY "Users can update their own reports"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own reports
CREATE POLICY "Users can delete their own reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
