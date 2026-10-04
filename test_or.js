const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  // Let's create a dummy query to see if syntax is valid
  const { data, error } = await supabase.from('blocked_users').select('id')
    .or(`and(blocker_id.eq.123e4567-e89b-12d3-a456-426614174000,blocked_id.eq.123e4567-e89b-12d3-a456-426614174001),and(blocker_id.eq.123e4567-e89b-12d3-a456-426614174001,blocked_id.eq.123e4567-e89b-12d3-a456-426614174000)`)
    .maybeSingle();

  console.log('Error:', error);
}
check();
