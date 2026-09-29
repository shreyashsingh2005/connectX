const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim() || env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const supabase = createClient(url, key);

(async () => {
  // If we only have anon key, we can't update directly, we need an RPC
  const { data, error } = await supabase.rpc('debug_conversation', { c_id: 'a6fc97ec-9b29-4f4f-ac12-48f4b7cbfcdc' });
  console.log("Got members to reset keys...");
})();
