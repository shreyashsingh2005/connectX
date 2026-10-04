-- Add cleared_at to conversation_members to track per-user cleared chat history
ALTER TABLE public.conversation_members
ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;

-- RPC to clear conversation history for the current user
CREATE OR REPLACE FUNCTION public.clear_conversation_for_current_user(p_conversation_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify membership
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_members 
    WHERE conversation_id = p_conversation_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to clear this conversation';
  END IF;

  -- Update cleared_at for the current user only
  UPDATE public.conversation_members
  SET cleared_at = NOW()
  WHERE conversation_id = p_conversation_id 
  AND user_id = auth.uid();
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.clear_conversation_for_current_user(UUID) TO authenticated;
