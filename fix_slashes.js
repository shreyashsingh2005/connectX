const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatThemePicker.tsx', 'utf8');

code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/chat/ChatThemePicker.tsx', code, 'utf8');
console.log('Fixed backslashes');
