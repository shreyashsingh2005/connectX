CREATE OR REPLACE FUNCTION public.create_group_conversation(group_name TEXT, member_ids UUID[])
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_conversation_id UUID;
  v_member_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF group_name IS NULL OR trim(group_name) = '' THEN
    RAISE EXCEPTION 'Group name cannot be empty';
  END IF;

  -- Create new group conversation
  INSERT INTO conversations (type, name, created_by) 
  VALUES ('group', trim(group_name), v_current_user_id) 
  RETURNING id INTO v_conversation_id;
  
  -- Add creator as owner
  INSERT INTO conversation_members (conversation_id, user_id, role)
  VALUES (v_conversation_id, v_current_user_id, 'owner');
    
  -- Add other members
  FOREACH v_member_id IN ARRAY member_ids
  LOOP
    IF v_member_id != v_current_user_id THEN
      INSERT INTO conversation_members (conversation_id, user_id, role)
      VALUES (v_conversation_id, v_member_id, 'member');
    END IF;
  END LOOP;
    
  RETURN v_conversation_id;
END;
$$;

-- Now we can lock down the overly permissive RLS policies on conversations and conversation_members
-- Drop the overly permissive insert policies
DROP POLICY IF EXISTS "Users can insert members" ON conversation_members;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;

-- Users can only insert conversations if they are the creator (for future direct inserts if any)
-- but actually we rely on RPCs for inserting.
-- But just in case, we can restrict it so you can only create conversations where created_by is you.
CREATE POLICY "Users can insert conversations" 
ON conversations FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND (created_by = auth.uid() OR created_by IS NULL));

-- For members, a user can only add themselves. Adding others must go through the SECURITY DEFINER RPC.
CREATE POLICY "Users can insert own membership" 
ON conversation_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);
