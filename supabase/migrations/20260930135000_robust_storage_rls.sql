DROP POLICY IF EXISTS "Users can download attachments of their conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their conversations" ON storage.objects;

-- SELECT policy: User can download if the file is linked to a conversation they are a member of
CREATE POLICY "Users can download attachments of their conversations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  auth.role() = 'authenticated' AND
  (
    -- Check via attachments table (handles all path formats)
    EXISTS (
      SELECT 1 FROM public.attachments a
      JOIN public.conversation_members cm ON a.conversation_id = cm.conversation_id
      WHERE a.storage_path = storage.objects.name
      AND cm.user_id = auth.uid()
    )
    OR
    -- Check via conversation_id in the new path format (for immediately after upload before db insert)
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = (string_to_array(storage.objects.name, '/'))[1]::uuid
      AND conversation_members.user_id = auth.uid()
    )
  )
);

-- INSERT policy: User can upload if the path starts with a conversation they are in
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
