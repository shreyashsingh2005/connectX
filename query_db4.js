const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
if (urlMatch && keyMatch) {
  fetch(`${urlMatch[1]}/rest/v1/?apikey=${keyMatch[1]}`)
  .then(res => res.json())
  .then(data => {
    const msgs = data.definitions.messages.properties;
    console.log(Object.keys(msgs));
  });
}
