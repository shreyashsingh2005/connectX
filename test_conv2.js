const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const adminSupabase = createClient(url, adminKey);

(async () => {
  const { data, error } = await adminSupabase
    .from('conversations')
    .select(`
      *,
      members:conversation_members(
        user_id, role,
        profile:profiles(id, username, display_name, avatar_url, is_online, last_seen)
      ),
      last_message:messages!fk_last_message(id, content, type, created_at, sender_id, is_deleted)
    `)
    .in('id', ['a6fc97ec-9b29-4f4f-ac12-48f4b7cbfcdc'])
    .order('last_message_at', { ascending: false });

  if (error) console.error("QUERY ERROR:", error);
  else console.log("SUCCESS:", JSON.stringify(data, null, 2).substring(0, 500));
})();
