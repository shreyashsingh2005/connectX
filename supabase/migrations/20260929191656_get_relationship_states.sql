CREATE OR REPLACE FUNCTION get_relationship_states(p_target_ids UUID[])
RETURNS TABLE(target_id UUID, state TEXT, request_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user UUID := auth.uid();
  v_target UUID;
  v_state TEXT;
  v_req_id UUID;
  v_friendship_id UUID;
BEGIN
  FOR v_target IN SELECT unnest(p_target_ids) LOOP
    v_state := 'NONE';
    v_req_id := NULL;
    
    -- Check friendship
    SELECT id INTO v_friendship_id FROM friendships 
    WHERE (user_id = v_current_user AND friend_id = v_target) 
       OR (user_id = v_target AND friend_id = v_current_user)
    LIMIT 1;
    
    IF v_friendship_id IS NOT NULL THEN
      v_state := 'FRIENDS';
    ELSE
      -- Check pending requests
      SELECT id INTO v_req_id FROM friend_requests
      WHERE (sender_id = v_current_user AND receiver_id = v_target AND status = 'pending')
      LIMIT 1;
      
      IF v_req_id IS NOT NULL THEN
        v_state := 'OUTGOING_PENDING';
      ELSE
        SELECT id INTO v_req_id FROM friend_requests
        WHERE (sender_id = v_target AND receiver_id = v_current_user AND status = 'pending')
        LIMIT 1;
        
        IF v_req_id IS NOT NULL THEN
          v_state := 'INCOMING_PENDING';
        END IF;
      END IF;
    END IF;
    
    target_id := v_target;
    state := v_state;
    request_id := v_req_id;
    RETURN NEXT;
  END LOOP;
END;
$$;
