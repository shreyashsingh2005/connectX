-- ==========================================
-- CONNECTX PRODUCTION OPTIMIZATIONS
-- ==========================================

-- 1. Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles (is_online) WHERE is_online = true;

-- 2. Friend Requests
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON public.friend_requests (sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON public.friend_requests (receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests (status);

-- 3. Friendships
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships (user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships (friend_id);

-- 4. Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations (last_message_at DESC);

-- 5. Conversation Members
CREATE INDEX IF NOT EXISTS idx_conv_members_user_id ON public.conversation_members (user_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_conversation_id ON public.conversation_members (conversation_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_members_unique_user_conv ON public.conversation_members (user_id, conversation_id);

-- 6. Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);

-- 7. Attachments
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments (message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_conversation_id ON public.attachments (conversation_id);

-- 8. Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- Analyze to update statistics
ANALYZE public.profiles;
ANALYZE public.friend_requests;
ANALYZE public.friendships;
ANALYZE public.conversations;
ANALYZE public.conversation_members;
ANALYZE public.messages;
ANALYZE public.attachments;
ANALYZE public.notifications;

