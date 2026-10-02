-- 1. Create avatars bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure RLS is properly set for avatars bucket
CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' AND auth.uid() = owner );
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- 2. Create user_theme_preferences table
CREATE TABLE IF NOT EXISTS public.user_theme_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL DEFAULT 'connect-purple',
  background_id TEXT NOT NULL DEFAULT 'solid',
  background_intensity TEXT NOT NULL DEFAULT 'low',
  accent_color TEXT NOT NULL DEFAULT 'purple',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_theme_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own global theme preferences" 
  ON public.user_theme_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own global theme preferences" 
  ON public.user_theme_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own global theme preferences" 
  ON public.user_theme_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- 3. Create chat_theme_preferences table
CREATE TABLE IF NOT EXISTS public.chat_theme_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL DEFAULT 'connect-purple',
  background_id TEXT NOT NULL DEFAULT 'solid',
  background_intensity TEXT NOT NULL DEFAULT 'low',
  accent_color TEXT NOT NULL DEFAULT 'purple',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, conversation_id)
);

ALTER TABLE public.chat_theme_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat theme preferences" 
  ON public.chat_theme_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat theme preferences" 
  ON public.chat_theme_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat theme preferences" 
  ON public.chat_theme_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat theme preferences" 
  ON public.chat_theme_preferences FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_theme_preferences_modtime ON public.user_theme_preferences;
CREATE TRIGGER update_user_theme_preferences_modtime
    BEFORE UPDATE ON public.user_theme_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_theme_preferences_modtime ON public.chat_theme_preferences;
CREATE TRIGGER update_chat_theme_preferences_modtime
    BEFORE UPDATE ON public.chat_theme_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
