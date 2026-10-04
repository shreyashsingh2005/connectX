-- Grant necessary privileges to the authenticated role for blocked_users
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.pinned_messages TO authenticated;

-- Ensure service_role has full access for backend admin operations if needed
GRANT ALL ON public.blocked_users TO service_role;
GRANT ALL ON public.pinned_messages TO service_role;

-- Update blocked_users INSERT policy to prevent blocking oneself
DROP POLICY IF EXISTS "Users can insert their own blocks" ON public.blocked_users;
CREATE POLICY "Users can insert their own blocks" ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);
