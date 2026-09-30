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

  -- Check if direct conversation already exists
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

  -- Create new direct conversation
  INSERT INTO conversations (type) VALUES ('direct') RETURNING id INTO v_conversation_id;
  
  -- Add members
  INSERT INTO conversation_members (conversation_id, user_id, role)
  VALUES 
    (v_conversation_id, v_current_user_id, 'owner'),
    (v_conversation_id, other_user_id, 'owner');
    
  RETURN v_conversation_id;
END;
$$;
