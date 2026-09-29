-- ==============================================================================
-- CONNECTX - FRIEND SYSTEM & USERNAME ENFORCEMENT MIGRATION
-- ==============================================================================

-- 1. Ensure username_normalized exists and is unique on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_normalized TEXT;

-- Update existing profiles (if any) with a lowercase username
UPDATE profiles SET username_normalized = LOWER(username) WHERE username IS NOT NULL;

-- Make username_normalized unique
DROP INDEX IF EXISTS profiles_username_normalized_idx;
CREATE UNIQUE INDEX profiles_username_normalized_idx ON profiles (username_normalized);

-- Restrict spaces and enforce username rules via check constraint if desired
-- ALTER TABLE profiles ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$');

-- ==============================================================================
-- 2. Create friend_requests table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_request CHECK (sender_id != receiver_id)
);

-- Unique index to prevent multiple active pending requests between same users
DROP INDEX IF EXISTS unique_active_request;
CREATE UNIQUE INDEX unique_active_request
ON friend_requests (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
WHERE status = 'pending';

-- Trigger to update 'updated_at' on friend_requests
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_friend_requests_updated_at ON friend_requests;
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- 3. Create friendships table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_friend CHECK (user_id != friend_id)
);

-- Ensure friendships are perfectly unique pairs
DROP INDEX IF EXISTS unique_friendship;
CREATE UNIQUE INDEX unique_friendship
ON friendships (user_id, friend_id);

-- ==============================================================================
-- 4. Enable Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Friend Requests Policies
DROP POLICY IF EXISTS "Users can view their own requests" ON friend_requests;
CREATE POLICY "Users can view their own requests" 
ON friend_requests FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert requests they send" ON friend_requests;
CREATE POLICY "Users can insert requests they send" 
ON friend_requests FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update requests they sent or received" ON friend_requests;
CREATE POLICY "Users can update requests they sent or received" 
ON friend_requests FOR UPDATE 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Friendships Policies
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
CREATE POLICY "Users can view their own friendships" 
ON friendships FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can insert own friendships" ON friendships;
CREATE POLICY "Users can insert own friendships" 
ON friendships FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;
CREATE POLICY "Users can delete own friendships" 
ON friendships FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ==============================================================================
-- 5. RPC Functions for safe atomic operations
-- ==============================================================================

-- Accept friend request
CREATE OR REPLACE FUNCTION accept_friend_request(req_id UUID)
RETURNS void AS $$
DECLARE
  req_sender UUID;
  req_receiver UUID;
  req_status TEXT;
BEGIN
  -- get request details
  SELECT sender_id, receiver_id, status INTO req_sender, req_receiver, req_status
  FROM friend_requests WHERE id = req_id;

  IF req_receiver != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF req_status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- update request
  UPDATE friend_requests SET status = 'accepted' WHERE id = req_id;

  -- insert bidirectional friendships
  INSERT INTO friendships (user_id, friend_id) VALUES (req_sender, req_receiver) ON CONFLICT DO NOTHING;
  INSERT INTO friendships (user_id, friend_id) VALUES (req_receiver, req_sender) ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove friend
CREATE OR REPLACE FUNCTION remove_friend(target_friend_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete bidirectional friendships
  DELETE FROM friendships 
  WHERE (user_id = auth.uid() AND friend_id = target_friend_id)
     OR (user_id = target_friend_id AND friend_id = auth.uid());

  -- Update any accepted request to 'cancelled' or delete it
  DELETE FROM friend_requests
  WHERE status = 'accepted'
    AND ((sender_id = auth.uid() AND receiver_id = target_friend_id)
      OR (sender_id = target_friend_id AND receiver_id = auth.uid()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. Notifications for Friend System
-- ==============================================================================
-- The `notifications` table should already exist based on `src/types/index.ts`.
-- We will just ensure the user can trigger inserts for friend notifications.
-- Note: Often handled by frontend inserting a row, or a DB trigger.
-- For simplicity, let's let the frontend insert the notification, assuming RLS allows it.

-- Enable realtime on new tables
-- ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests; -- Cannot easily make safe, will fail if exists
-- ALTER PUBLICATION supabase_realtime ADD TABLE friendships; -- Cannot easily make safe, will fail if exists

