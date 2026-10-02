const fs = require('fs');
let code = fs.readFileSync('src/hooks/useE2EE.ts', 'utf8');

code = code.replace(
  'const pubKey = (m.profiles as any)?.public_key;',
  'const pubKey = (m.profiles as any)?.public_key || (m.user_id === profile!.id ? profile!.public_key : null);'
);

fs.writeFileSync('src/hooks/useE2EE.ts', code, 'utf8');
console.log('Fixed pubKey fallback');
