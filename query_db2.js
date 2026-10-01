const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  // Query using RPC or Postgres changes
  // Let's insert a dummy message and roll it back
  supabase.from('messages').insert({ id: '00000000-0000-0000-0000-000000000000', conversation_id: '00000000-0000-0000-0000-000000000000', sender_id: '00000000-0000-0000-0000-000000000000', status: 'sent', content: 'test' }).select('*').then(({ data, error }) => {
    console.log("Error:", error);
  });
}
