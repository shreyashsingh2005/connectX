const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDb() {
  const { data: convs, error: cErr } = await supabase.from('conversations').select('id');
  
  for (const c of convs) {
    const { data: members, error: mErr } = await supabase
      .from('conversation_members')
      .select('id, user_id, encrypted_key, profiles(username)')
      .eq('conversation_id', c.id);
    
    console.log(`\nConversation ${c.id}:`);
    for (const m of members || []) {
      console.log(`  Member ${m.profiles?.username || m.user_id}: hasKey=${!!m.encrypted_key}`);
    }
  }
}

checkDb();
