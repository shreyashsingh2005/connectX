CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view blocks they are involved in" ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can insert their own blocks" ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

CREATE OR REPLACE FUNCTION public.is_user_blocked_by_any_member(p_sender_id UUID, p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM conversation_members cm
    JOIN blocked_users bu ON bu.blocker_id = cm.user_id
    WHERE cm.conversation_id = p_conversation_id
      AND bu.blocked_id = p_sender_id
  );
$$;

DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON messages;
CREATE POLICY "Users can insert messages to their conversations" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND 
  auth_user_in_conversation(conversation_id) AND
  NOT public.is_user_blocked_by_any_member(sender_id, conversation_id)
);

CREATE OR REPLACE FUNCTION public.start_direct_conversation(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_conversation_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE (blocker_id = v_current_user_id AND blocked_id = other_user_id)
       OR (blocker_id = other_user_id AND blocked_id = v_current_user_id)
  ) THEN
    RAISE EXCEPTION 'Cannot start conversation with this user';
  END IF;

  SELECT c.id INTO v_conversation_id
  FROM conversations c
  JOIN conversation_members m1 ON c.id = m1.conversation_id
  JOIN conversation_members m2 ON c.id = m2.conversation_id
  WHERE c.type = 'direct'
    AND m1.user_id = v_current_user_id
    AND m2.user_id = other_user_id
  LIMIT 1;
    
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO conversations (type) VALUES ('direct') RETURNING id INTO v_conversation_id;
  
  INSERT INTO conversation_members (conversation_id, user_id, role)
  VALUES 
    (v_conversation_id, v_current_user_id, 'owner'),
    (v_conversation_id, other_user_id, 'owner');
    
  RETURN v_conversation_id;
END;
$$;
