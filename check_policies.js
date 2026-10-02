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
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'objects', schema_name: 'storage' }).catch(() => ({ data: null, error: null }));
  if (data) {
    console.log(data);
  } else {
    // Manually query pg_policies
    const { data: policies, error: pErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'objects').eq('schemaname', 'storage');
    console.log('Policies:', policies || pErr);
  }
}
run();
