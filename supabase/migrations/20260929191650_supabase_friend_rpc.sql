-- ==========================================
-- CONNECTX: FRIEND REQUEST RPC
-- ==========================================

CREATE OR REPLACE FUNCTION send_friend_request(p_sender_id UUID, p_receiver_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_existing_friendship UUID;
  v_existing_request UUID;
  v_request_id UUID;
BEGIN
  -- Prevent self-request
  IF p_sender_id = p_receiver_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot send friend request to yourself.');
  END IF;

  -- Check existing friendship
  SELECT id INTO v_existing_friendship FROM friendships 
  WHERE (user_id = p_sender_id AND friend_id = p_receiver_id) 
     OR (user_id = p_receiver_id AND friend_id = p_sender_id);
     
  IF v_existing_friendship IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already friends.');
  END IF;

  -- Check existing request
  SELECT id INTO v_existing_request FROM friend_requests
  WHERE (sender_id = p_sender_id AND receiver_id = p_receiver_id AND status = 'pending')
     OR (sender_id = p_receiver_id AND receiver_id = p_sender_id AND status = 'pending');
     
  IF v_existing_request IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Friend request already exists.');
  END IF;

  -- Create request
  INSERT INTO friend_requests (sender_id, receiver_id, status)
  VALUES (p_sender_id, p_receiver_id, 'pending')
  RETURNING id INTO v_request_id;

  -- Create notification securely
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT p_receiver_id, 'friend_request', 'New Friend Request', display_name || ' sent you a friend request.', jsonb_build_object('request_id', v_request_id, 'sender_id', p_sender_id)
  FROM profiles WHERE id = p_sender_id;

  RETURN json_build_object('success', true, 'request_id', v_request_id);
END;
$function$;

-- Replace accept_friend_request RPC if needed
CREATE OR REPLACE FUNCTION accept_friend_request(p_request_id UUID, p_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_req RECORD;
BEGIN
  SELECT * INTO v_req FROM friend_requests WHERE id = p_request_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found.');
  END IF;

  IF v_req.receiver_id != p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Request already processed.');
  END IF;

  -- Update request
  UPDATE friend_requests SET status = 'accepted', updated_at = NOW() WHERE id = p_request_id;

  -- Create bidirectional friendship
  INSERT INTO friendships (user_id, friend_id) VALUES (v_req.sender_id, v_req.receiver_id) ON CONFLICT DO NOTHING;
  INSERT INTO friendships (user_id, friend_id) VALUES (v_req.receiver_id, v_req.sender_id) ON CONFLICT DO NOTHING;

  -- Notification
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT v_req.sender_id, 'friend_accepted', 'Request Accepted', display_name || ' accepted your friend request.', jsonb_build_object('friend_id', p_user_id)
  FROM profiles WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$function$;

