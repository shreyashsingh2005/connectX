const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Testing pinned_messages...');
  const res1 = await supabase.from('pinned_messages').select('*').limit(1);
  console.log('pinned_messages:', res1.error ? res1.error.message : 'EXISTS (count: ' + res1.data.length + ')');

  console.log('Testing blocked_users...');
  const res2 = await supabase.from('blocked_users').select('*').limit(1);
  console.log('blocked_users:', res2.error ? res2.error.message : 'EXISTS (count: ' + res2.data.length + ')');
}
test();
