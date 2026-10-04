CREATE OR REPLACE FUNCTION public.is_user_blocked_by_any_member(p_sender_id UUID, p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM conversation_members cm
    JOIN blocked_users bu ON 
      (bu.blocker_id = cm.user_id AND bu.blocked_id = p_sender_id)
      OR 
      (bu.blocked_id = cm.user_id AND bu.blocker_id = p_sender_id)
    WHERE cm.conversation_id = p_conversation_id
      AND cm.user_id != p_sender_id
  );
$$;
