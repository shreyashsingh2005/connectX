CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id)
);

ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pinned messages in their conversations" ON public.pinned_messages
  FOR SELECT USING (auth_user_in_conversation(conversation_id));

CREATE POLICY "Users can pin messages in their conversations" ON public.pinned_messages
  FOR INSERT WITH CHECK (auth.uid() = pinned_by AND auth_user_in_conversation(conversation_id));

CREATE POLICY "Users can unpin messages in their conversations" ON public.pinned_messages
  FOR DELETE USING (auth_user_in_conversation(conversation_id));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_messages;
