-- Fix parameter name to conversation_id
DROP FUNCTION IF EXISTS public.clear_conversation_for_current_user(UUID);

CREATE OR REPLACE FUNCTION public.clear_conversation_for_current_user(conversation_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify membership
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = clear_conversation_for_current_user.conversation_id 
    AND cm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to clear this conversation';
  END IF;

  -- Update cleared_at for the current user only
  UPDATE public.conversation_members cm
  SET cleared_at = NOW()
  WHERE cm.conversation_id = clear_conversation_for_current_user.conversation_id 
  AND cm.user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_conversation_for_current_user(UUID) TO authenticated;
