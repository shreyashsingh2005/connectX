const fs = require('fs');
let code = fs.readFileSync('src/hooks/useE2EE.ts', 'utf8');

code = code.replace(
  'await supabase.from(\'profiles\').update({ public_key: pubKeyB64 }).eq(\'id\', profile!.id);',
  'await supabase.from(\'profiles\').update({ public_key: pubKeyB64 }).eq(\'id\', profile!.id);\n            useAuthStore.getState().setProfile({ ...profile!, public_key: pubKeyB64 });'
);

code = code.replace(
  'await supabase.from(\'profiles\').update({ public_key: pubKeyB64 }).eq(\'id\', profile!.id);',
  'await supabase.from(\'profiles\').update({ public_key: pubKeyB64 }).eq(\'id\', profile!.id);\n            useAuthStore.getState().setProfile({ ...profile!, public_key: pubKeyB64 });'
);

fs.writeFileSync('src/hooks/useE2EE.ts', code, 'utf8');
console.log('Fixed initIdentity Zustand update');
