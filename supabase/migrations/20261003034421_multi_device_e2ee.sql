-- 1. Create user_devices table
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own devices" ON user_devices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view devices of conversation members" ON user_devices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_members m1
    JOIN conversation_members m2 ON m1.conversation_id = m2.conversation_id
    WHERE m1.user_id = auth.uid() AND m2.user_id = user_devices.user_id
  )
);

-- 2. Add encrypted_keys JSONB to conversation_members
ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS encrypted_keys JSONB DEFAULT '{}'::jsonb;

-- 3. Update the RPC to support updating encrypted_keys
CREATE OR REPLACE FUNCTION public.update_member_keys(p_member_id UUID, p_encrypted_keys JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = (SELECT conversation_id FROM conversation_members WHERE id = p_member_id)
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to update keys for this conversation';
  END IF;

  UPDATE conversation_members
  SET encrypted_keys = p_encrypted_keys
  WHERE id = p_member_id;
END;
$$;
