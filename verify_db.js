const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets ? buckets.map(b => b.name).join(', ') : 'Error: ' + bErr.message);

  const { data, error } = await supabase.from('user_theme_preferences').select('*').limit(1);
  console.log('user_theme_preferences rows:', data ? data.length : 'Error: ' + error.message);
}
run();
