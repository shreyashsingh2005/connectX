-- Make attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'attachments';

-- Drop existing public access policy
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to read" ON storage.objects;

-- Create secure policy for SELECT (downloading attachments)
CREATE POLICY "Users can download attachments of their conversations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_members.conversation_id = (string_to_array(storage.objects.name, '/'))[1]::uuid
    AND conversation_members.user_id = auth.uid()
  )
);

-- Note: The existing INSERT policy only checked bucket_id and role. We can tighten it!
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Users can upload to their conversations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_members.conversation_id = (string_to_array(storage.objects.name, '/'))[1]::uuid
    AND conversation_members.user_id = auth.uid()
  )
);
