
CREATE OR REPLACE FUNCTION public.reset_conversation_keys(p_conversation_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to reset keys for this conversation';
  END IF;

  UPDATE conversation_members
  SET encrypted_key = NULL, encrypted_keys = '{}'::jsonb
  WHERE conversation_id = p_conversation_id;
END;
$$;
