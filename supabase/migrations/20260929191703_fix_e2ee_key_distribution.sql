DROP POLICY IF EXISTS "Users can update own membership" ON public.conversation_members;
CREATE POLICY "Users can update conversation members" ON public.conversation_members FOR UPDATE USING (
  auth_user_in_conversation(conversation_id)
);
