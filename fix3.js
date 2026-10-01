const fs = require('fs');
let t = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');
t = t.replace('{\\u{1F6AB}}', '{"\\u{1F6AB}"}');
t = t.replace('{\\u{1F4CE}}', '{"\\u{1F4CE}"}');
fs.writeFileSync('src/components/chat/MessageBubble.tsx', t, 'utf8');
