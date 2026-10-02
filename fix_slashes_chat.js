const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');

code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', code, 'utf8');
console.log('Fixed backslashes in chat page');
