CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view reactions in their conversations" ON public.message_reactions;
CREATE POLICY "Users can view reactions in their conversations" ON public.message_reactions FOR SELECT USING (
  auth_user_in_conversation((SELECT conversation_id FROM public.messages WHERE id = message_reactions.message_id))
);

DROP POLICY IF EXISTS "Users can add reactions" ON public.message_reactions;
CREATE POLICY "Users can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  auth_user_in_conversation((SELECT conversation_id FROM public.messages WHERE id = message_reactions.message_id))
);

DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.message_reactions;
CREATE POLICY "Users can remove their own reactions" ON public.message_reactions FOR DELETE USING (
  auth.uid() = user_id
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
