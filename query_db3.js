const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  fetch(`${urlMatch[1]}/rest/v1/messages?limit=1`, {
    headers: { apikey: keyMatch[1], Authorization: `Bearer ${keyMatch[1]}` }
  }).then(res => res.json()).then(data => {
    if (data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log("No data. Cannot infer columns from REST API unless we do an OPTIONS request.");
    }
  });
  
  fetch(`${urlMatch[1]}/rest/v1/messages`, {
    method: 'OPTIONS',
    headers: { apikey: keyMatch[1], Authorization: `Bearer ${keyMatch[1]}` }
  }).then(res => res.text()).then(data => console.log("OPTIONS:", data.substring(0, 500)));
}
