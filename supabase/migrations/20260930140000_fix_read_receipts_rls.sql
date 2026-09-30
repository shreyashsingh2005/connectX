DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;

-- A user can update their OWN messages entirely (e.g. edit content)
-- A user can also update the status of OTHER people's messages to 'read' if they are in the conversation.
CREATE POLICY "Users can update messages in their conversations"
ON public.messages FOR UPDATE
USING (
  -- Either they are the sender
  auth.uid() = sender_id
  OR
  -- Or they are a member of the conversation (allowing them to update status to read)
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_members.conversation_id = messages.conversation_id
    AND conversation_members.user_id = auth.uid()
  )
);
