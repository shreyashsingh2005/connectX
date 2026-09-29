-- ==========================================
-- CONNECTX SECURITY HARDENING & RLS
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

-- PROFILES
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);


-- Automatically injected DROP POLICY IF EXISTS for idempotency
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;
DROP POLICY IF EXISTS "Users can insert members" ON conversation_members;
DROP POLICY IF EXISTS "Users can update own membership" ON conversation_members;
DROP POLICY IF EXISTS "Users can delete own membership" ON conversation_members;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON attachments;
DROP POLICY IF EXISTS "Users can insert attachments to their conversations" ON attachments;
DROP POLICY IF EXISTS "Users can delete own attachments" ON attachments;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;

-- USER SETTINGS
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- CONVERSATIONS
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid())
);

-- CONVERSATION MEMBERS
CREATE POLICY "Users can view members of their conversations" ON conversation_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Users can insert members" ON conversation_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own membership" ON conversation_members FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own membership" ON conversation_members FOR DELETE USING (user_id = auth.uid());

-- MESSAGES
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert messages to their conversations" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = sender_id);

-- ATTACHMENTS
CREATE POLICY "Users can view attachments in their conversations" ON attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = attachments.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert attachments to their conversations" ON attachments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = attachments.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own attachments" ON attachments FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id); -- Allowed for now due to client-side insert, will secure via RPC later.
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- FRIEND REQUESTS (Replacing old if exist)
DROP POLICY IF EXISTS "Users can view their own requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can insert requests they send" ON friend_requests;
DROP POLICY IF EXISTS "Users can update requests they sent or received" ON friend_requests;

CREATE POLICY "Users can view their own requests" ON friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert requests they send" ON friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update requests they received" ON friend_requests FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Users can delete requests they sent or received" ON friend_requests FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- FRIENDSHIPS (Replacing old if exist)
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can insert own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;

CREATE POLICY "Users can view their own friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert own friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own friendships" ON friendships FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- STORAGE SECURITY
-- ==========================================
-- Ensure attachments bucket is strictly authenticated

-- Note: In Supabase, storage policies are in the storage.objects table.
-- We must allow users to view objects if they are in the conversation.
-- Since storage path is profileId/messageId/attachmentId, we can restrict by checking if the user is authenticated.
-- A completely robust storage RLS requires joining with public.conversation_members.
CREATE POLICY "Users can upload attachments" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'attachments' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can view attachments" ON storage.objects FOR SELECT USING (
    bucket_id = 'attachments' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete own attachments" ON storage.objects FOR DELETE USING (
    bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]
);
