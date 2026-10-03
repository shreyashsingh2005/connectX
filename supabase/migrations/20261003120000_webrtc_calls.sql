-- Create call_sessions table for WebRTC signaling and history
CREATE TABLE IF NOT EXISTS public.call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  caller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('audio', 'video')),
  status text NOT NULL CHECK (status IN ('ringing', 'accepted', 'rejected', 'missed', 'cancelled', 'connected', 'ended', 'failed', 'busy')),
  offer jsonb,
  answer jsonb,
  caller_candidates jsonb DEFAULT '[]'::jsonb,
  receiver_candidates jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  answered_at timestamptz,
  ended_at timestamptz,
  ended_reason text,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Indexes for fast querying by user
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller ON public.call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_receiver ON public.call_sessions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_conversation ON public.call_sessions(conversation_id);

-- RLS Policies
-- Users can see calls where they are caller or receiver
CREATE POLICY "Users can view their own calls"
  ON public.call_sessions FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Users can insert a call if they are the caller AND they are in the conversation
CREATE POLICY "Users can initiate calls"
  ON public.call_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = caller_id AND
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = call_sessions.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Users can update calls if they are participants
CREATE POLICY "Users can update their calls"
  ON public.call_sessions FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Add call_sessions to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
