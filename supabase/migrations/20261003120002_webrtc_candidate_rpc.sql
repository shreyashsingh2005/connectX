CREATE OR REPLACE FUNCTION public.append_call_ice_candidate(
  p_call_id uuid,
  p_side text,
  p_candidate jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_call RECORD;
  v_array jsonb;
BEGIN
  -- Validate side
  IF p_side NOT IN ('caller', 'receiver') THEN
    RAISE EXCEPTION 'Invalid side';
  END IF;

  -- Fetch call and lock row for update to prevent concurrent race conditions
  SELECT caller_id, receiver_id, caller_candidates, receiver_candidates 
  INTO v_call 
  FROM public.call_sessions 
  WHERE id = p_call_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Call not found';
  END IF;

  -- Verify authorization
  IF auth.uid() != v_call.caller_id AND auth.uid() != v_call.receiver_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Prevent impersonation
  IF p_side = 'caller' AND auth.uid() != v_call.caller_id THEN
    RAISE EXCEPTION 'Unauthorized: must be caller';
  END IF;

  IF p_side = 'receiver' AND auth.uid() != v_call.receiver_id THEN
    RAISE EXCEPTION 'Unauthorized: must be receiver';
  END IF;

  -- Determine array to append to
  IF p_side = 'caller' THEN
    v_array := COALESCE(v_call.caller_candidates, '[]'::jsonb);
  ELSE
    v_array := COALESCE(v_call.receiver_candidates, '[]'::jsonb);
  END IF;

  -- Deduplicate based on candidate property
  IF v_array @> jsonb_build_array(p_candidate) THEN
    -- Already exists
    RETURN;
  END IF;

  -- Append and update
  IF p_side = 'caller' THEN
    UPDATE public.call_sessions 
    SET caller_candidates = v_array || jsonb_build_array(p_candidate)
    WHERE id = p_call_id;
  ELSE
    UPDATE public.call_sessions 
    SET receiver_candidates = v_array || jsonb_build_array(p_candidate)
    WHERE id = p_call_id;
  END IF;
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.append_call_ice_candidate TO authenticated;
