const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('objects').select('*').limit(1).catch(() => ({}));
  // let's just query Postgres directly if we can't
  const { data: qData, error: qErr } = await supabase.rpc('pg_query', { query: 'SELECT * FROM pg_policies WHERE schemaname=\'storage\';' });
  console.log(qData || qErr);
}
run();
