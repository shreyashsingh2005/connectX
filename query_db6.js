const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
if (urlMatch && keyMatch) {
  fetch(`${urlMatch[1]}/rest/v1/messages?select=status&limit=1`, {
    headers: { apikey: keyMatch[1], Authorization: `Bearer ${keyMatch[1]}` }
  }).then(res => res.json()).then(console.log);
}
