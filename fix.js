const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');
content = content.replace(/from\('chat_attachments'\)/g, "from('attachments')");
fs.writeFileSync('src/components/chat/MessageComposer.tsx', content);
