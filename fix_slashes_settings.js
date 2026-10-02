const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code, 'utf8');
console.log('Fixed backslashes in settings');
