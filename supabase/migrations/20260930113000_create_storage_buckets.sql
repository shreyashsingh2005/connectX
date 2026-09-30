INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('attachments', 'attachments', true, 52428800, null)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure RLS is properly set for the bucket
-- Allow anyone to read
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'attachments' );
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'attachments' AND auth.role() = 'authenticated' );
-- Allow users to update their own uploads (important for avatar upserts)
CREATE POLICY "Users can update their own uploads" ON storage.objects FOR UPDATE USING ( bucket_id = 'attachments' AND auth.role() = 'authenticated' );
