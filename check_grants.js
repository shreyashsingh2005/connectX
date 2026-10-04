const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const sql = `
    SELECT grantee, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_name IN ('blocked_users', 'pinned_messages')
  `;
  const { data, error } = await supabase.rpc('execute_sql', { query: sql });
  console.log('GRANTS:', JSON.stringify(data, null, 2), error);
}
check();
