const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');
code = code.replace(/duration-200/g, 'duration-150');
fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log('Fixed animation duration');
