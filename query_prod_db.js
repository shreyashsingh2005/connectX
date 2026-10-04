const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runSQL(sql) {
  const { data, error } = await supabase.rpc('execute_sql', { query: sql });
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('RESULT:', JSON.stringify(data, null, 2));
  }
}

async function main() {
  console.log('--- BLOCKED USERS ---');
  await runSQL("SELECT * FROM blocked_users");
  
  console.log('--- PINNED MESSAGES ---');
  await runSQL("SELECT * FROM pinned_messages");
  
  console.log('--- DB FUNCTIONS ---');
  await runSQL("SELECT proname, prosrc FROM pg_proc WHERE proname IN ('is_user_blocked_by_any_member', 'check_message_in_conversation')");
  
  console.log('--- RLS POLICIES FOR MESSAGES ---');
  await runSQL("SELECT policyname, qual, with_check FROM pg_policies WHERE tablename = 'messages' AND cmd = 'INSERT'");

  console.log('--- RLS POLICIES FOR PINNED MESSAGES ---');
  await runSQL("SELECT policyname, qual, with_check FROM pg_policies WHERE tablename = 'pinned_messages'");
}
main();
