const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const supabase = createClient(url, key);

(async () => {
  const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
    p_user1_id: '00000000-0000-0000-0000-000000000001',
    p_user2_id: '00000000-0000-0000-0000-000000000002'
  });
  console.log("RPC Data:", data);
  console.log("RPC Error:", error);
})();
