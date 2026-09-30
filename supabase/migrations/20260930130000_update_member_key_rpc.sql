CREATE OR REPLACE FUNCTION public.update_member_key(p_member_id UUID, p_encrypted_key TEXT)
RETURNS VOID
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

  -- Verify the member_id exists and get its conversation_id
  SELECT conversation_id INTO v_conversation_id
  FROM conversation_members
  WHERE id = p_member_id;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  -- Verify the current user is a member of this conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = v_conversation_id
    AND user_id = v_current_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not a member of this conversation';
  END IF;

  -- Update ONLY the encrypted_key column safely
  UPDATE conversation_members
  SET encrypted_key = p_encrypted_key
  WHERE id = p_member_id;
END;
$$;
