const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const supabase = createClient(url, key);

(async () => {
  // pick two random profiles
  const { data: profiles } = await supabase.from('profiles').select('id').limit(2);
  console.log("Profiles:", profiles);
  
  if (profiles && profiles.length >= 2) {
    const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
      p_user1_id: profiles[0].id,
      p_user2_id: profiles[1].id
    });
    console.log("RPC Data:", data);
    console.log("RPC Error:", error);
  }
})();
