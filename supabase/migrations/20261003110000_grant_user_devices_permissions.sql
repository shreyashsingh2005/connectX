-- Fix user_devices permissions
GRANT ALL ON TABLE public.user_devices TO authenticated;
GRANT ALL ON TABLE public.user_devices TO anon;
GRANT ALL ON TABLE public.user_devices TO service_role;
