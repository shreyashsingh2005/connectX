CREATE OR REPLACE FUNCTION public.check_message_in_conversation(p_message_id UUID, p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM messages WHERE id = p_message_id AND conversation_id = p_conversation_id
  );
$$;

DROP POLICY IF EXISTS "Users can pin messages in their conversations" ON public.pinned_messages;
CREATE POLICY "Users can pin messages in their conversations" ON public.pinned_messages
  FOR INSERT WITH CHECK (
    auth.uid() = pinned_by 
    AND auth_user_in_conversation(conversation_id)
    AND public.check_message_in_conversation(message_id, conversation_id)
  );
