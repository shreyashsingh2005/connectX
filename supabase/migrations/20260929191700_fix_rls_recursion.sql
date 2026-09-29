CREATE OR REPLACE FUNCTION auth_user_in_conversation(c_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_members 
    WHERE conversation_id = c_id AND user_id = auth.uid()
  );
$$;

-- Fix conversations policy just in case (though it's not recursive, it's cleaner)
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (
  auth_user_in_conversation(id)
);
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE USING (
  auth_user_in_conversation(id)
);

-- Fix conversation_members policy (This caused the infinite recursion)
DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;
CREATE POLICY "Users can view members of their conversations" ON conversation_members FOR SELECT USING (
  auth_user_in_conversation(conversation_id)
);

-- Fix messages policy
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  auth_user_in_conversation(conversation_id)
);
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON messages;
CREATE POLICY "Users can insert messages to their conversations" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND auth_user_in_conversation(conversation_id)
);

-- Fix attachments policy
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON attachments;
CREATE POLICY "Users can view attachments in their conversations" ON attachments FOR SELECT USING (
  auth_user_in_conversation(conversation_id)
);
DROP POLICY IF EXISTS "Users can insert attachments to their conversations" ON attachments;
CREATE POLICY "Users can insert attachments to their conversations" ON attachments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND auth_user_in_conversation(conversation_id)
);
