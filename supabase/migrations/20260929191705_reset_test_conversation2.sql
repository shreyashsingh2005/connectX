UPDATE public.conversation_members SET encrypted_key = NULL WHERE conversation_id = 'a6fc97ec-9b29-4f4f-ac12-48f4b7cbfcdc';
DELETE FROM public.messages WHERE conversation_id = 'a6fc97ec-9b29-4f4f-ac12-48f4b7cbfcdc';
