CREATE OR REPLACE FUNCTION debug_conversation(c_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_members JSON;
  v_messages JSON;
BEGIN
  SELECT json_agg(json_build_object('user_id', user_id, 'role', role)) INTO v_members
  FROM conversation_members WHERE conversation_id = c_id;
  
  SELECT json_agg(json_build_object('id', id, 'sender_id', sender_id, 'content', content)) INTO v_messages
  FROM messages WHERE conversation_id = c_id;
  
  RETURN json_build_object('members', v_members, 'messages', v_messages);
END;
$$;
