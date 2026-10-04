CREATE OR REPLACE FUNCTION public.get_message_policies()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(p)) INTO result
  FROM pg_policies p
  WHERE tablename = 'messages';
  RETURN result;
END;
$$;
