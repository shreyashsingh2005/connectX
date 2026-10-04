const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

code = code.replace(/text-\[15px\]/g, 'text-[14px]');
fs.writeFileSync('src/components/chat/MessageBubble.tsx', code);
console.log('Message text size updated');
