const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');
code = code.replace(/size="lg"/g, 'size="xl"');
fs.writeFileSync('src/app/(app)/contacts/page.tsx', code, 'utf8');
console.log("Updated avatar size to xl (48px)");
