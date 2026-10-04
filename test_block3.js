const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [k, ...v] = line.split('=');
    if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
    return acc;
  }, {});

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supaA = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supaA.auth.signUp({
    email: 'test_a_' + Date.now() + '@example.com',
    password: 'Password123!'
  });

  console.log(error || data);
}
run();
