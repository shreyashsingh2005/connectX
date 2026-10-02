const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfilePhotoEditor.tsx', 'utf8');

// Use exact 'profile.webp' path to be completely safe against any RLS exact-match strings
code = code.replace(
  /const fileName = \`\$\{user\.id\}\/\$\{Date\.now\(\)\}\.webp\`;/g,
  'const fileName = `${user.id}/profile.webp`;'
);

// Do not suppress errors!
// Already has toast.error

fs.writeFileSync('src/components/profile/ProfilePhotoEditor.tsx', code, 'utf8');
console.log('Fixed ProfilePhotoEditor DP path');
