-- ==============================================================================
-- CONNECTX - E2EE (End-to-End Encryption) MIGRATION
-- ==============================================================================

-- 1. Add public_key to profiles table
-- This stores the user's RSA-OAEP public key in SPKI base64 format.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS key_version INT DEFAULT 1;

-- 2. Add encrypted_key to conversation_members table
-- This stores the AES-GCM conversation key, encrypted with the user's public_key.
ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS encrypted_key TEXT;

-- 3. Ensure Storage Attachments Bucket is Private
-- The 'attachments' bucket should exist, but let's ensure it's private and has strict RLS.
-- (Note: If it does not exist, you must create it in the Supabase Dashboard as PRIVATE).

-- 4. Storage RLS Policies
-- Users can only upload to their own folder: user_id/...
-- Users can only read attachments in conversations they are a member of.
-- Note: Replace 'attachments' with your actual bucket name if different.

/*
-- Example strict storage policies (Execute in Supabase SQL editor):
CREATE POLICY "Users can upload attachments" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read attachments" ON storage.objects FOR SELECT
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Or write a more complex policy that joins with conversation_members to allow recipients to read.
*/

-- 5. Force all future messages to be encrypted text
-- (Optional check constraint if you want to ensure no plaintext is inserted)
-- ALTER TABLE messages ADD CONSTRAINT content_is_encrypted CHECK (content LIKE '%;%');
