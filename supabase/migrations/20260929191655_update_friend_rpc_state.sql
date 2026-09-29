CREATE OR REPLACE FUNCTION send_friend_request(p_sender_id UUID, p_receiver_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_friendship UUID;
  v_existing_req_id UUID;
  v_existing_req_sender UUID;
  v_request_id UUID;
BEGIN
  -- Prevent self-request
  IF p_sender_id = p_receiver_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot send friend request to yourself.', 'state', 'NONE');
  END IF;

  -- Check existing friendship
  SELECT id INTO v_existing_friendship FROM friendships 
  WHERE (user_id = p_sender_id AND friend_id = p_receiver_id) 
     OR (user_id = p_receiver_id AND friend_id = p_sender_id);
     
  IF v_existing_friendship IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already friends.', 'state', 'FRIENDS');
  END IF;

  -- Check existing request
  SELECT id, sender_id INTO v_existing_req_id, v_existing_req_sender FROM friend_requests
  WHERE ((sender_id = p_sender_id AND receiver_id = p_receiver_id)
     OR (sender_id = p_receiver_id AND receiver_id = p_sender_id))
     AND status = 'pending';
     
  IF v_existing_req_id IS NOT NULL THEN
    IF v_existing_req_sender = p_sender_id THEN
      RETURN json_build_object('success', false, 'error', 'Duplicate outgoing request.', 'state', 'OUTGOING_PENDING', 'request_id', v_existing_req_id);
    ELSE
      RETURN json_build_object('success', false, 'error', 'Existing incoming request.', 'state', 'INCOMING_PENDING', 'request_id', v_existing_req_id);
    END IF;
  END IF;

  -- Create request
  INSERT INTO friend_requests (sender_id, receiver_id, status)
  VALUES (p_sender_id, p_receiver_id, 'pending')
  RETURNING id INTO v_request_id;

  -- Create notification securely
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT p_receiver_id, 'friend_request', 'New Friend Request', display_name || ' sent you a friend request.', jsonb_build_object('request_id', v_request_id, 'sender_id', p_sender_id)
  FROM profiles WHERE id = p_sender_id;

  RETURN json_build_object('success', true, 'request_id', v_request_id, 'state', 'OUTGOING_PENDING');
END;
$$;
