const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDb() {
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, username, public_key');
  if (pErr) console.error('Profile error:', pErr);
  
  console.log('Profiles:', profiles?.map(p => ({
    id: p.id,
    username: p.username,
    hasPubKey: !!p.public_key,
    pubKeyLength: p.public_key?.length
  })));

  const { data: members, error: mErr } = await supabase.from('conversation_members').select('id, conversation_id, user_id, encrypted_key');
  if (mErr) console.error('Member error:', mErr);
  
  console.log('Members:', members?.map(m => ({
    id: m.id,
    conv_id: m.conversation_id,
    user_id: m.user_id,
    hasEncKey: !!m.encrypted_key,
    encKeyLength: m.encrypted_key?.length
  })));
}

checkDb();
