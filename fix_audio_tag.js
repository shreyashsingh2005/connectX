const fs = require('fs');
let content = fs.readFileSync('src/components/chat/EncryptedAttachment.tsx', 'utf8');
content = content.replace('<audio controls className="flex-1"', '<audio controls preload="metadata" className="flex-1"');
fs.writeFileSync('src/components/chat/EncryptedAttachment.tsx', content);
