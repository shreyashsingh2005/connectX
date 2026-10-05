-- Create an idempotent function to ensure a profile exists for the current authenticated user.
-- This safely replaces the client-side profile creation fallback which caused errors.

CREATE OR REPLACE FUNCTION public.ensure_profile_for_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Needs to bypass RLS to check/insert securely based on auth.uid()
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_user_metadata jsonb;
  v_username text;
  v_display_name text;
  v_avatar_url text;
  v_hex text;
BEGIN
  -- Get the current authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    -- Ensure settings exist just in case
    IF NOT EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = v_user_id) THEN
      INSERT INTO public.user_settings (user_id) VALUES (v_user_id) ON CONFLICT DO NOTHING;
    END IF;
    RETURN;
  END IF;

  -- Fetch user info from auth.users securely
  SELECT email, raw_user_meta_data INTO v_email, v_user_metadata
  FROM auth.users WHERE id = v_user_id;

  -- Generate safe fallback username
  v_hex := substr(md5(random()::text), 1, 8);
  v_username := COALESCE(v_user_metadata->>'username', 'user_' || v_hex);
  
  -- Handle potential username collisions safely
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username_normalized = lower(v_username)) THEN
    v_username := 'user_' || v_hex || substr(md5(random()::text), 1, 4);
  END IF;

  v_display_name := COALESCE(
    v_user_metadata->>'display_name', 
    v_user_metadata->>'full_name', 
    v_user_metadata->>'name', 
    'New User'
  );
  
  v_avatar_url := v_user_metadata->>'avatar_url';

  -- Insert the profile
  INSERT INTO public.profiles (
    id, 
    username, 
    username_normalized, 
    display_name, 
    email, 
    avatar_url
  ) VALUES (
    v_user_id,
    v_username,
    lower(v_username),
    v_display_name,
    v_email,
    v_avatar_url
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert default settings
  INSERT INTO public.user_settings (user_id) VALUES (v_user_id) ON CONFLICT DO NOTHING;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_profile_for_current_user() TO authenticated;
