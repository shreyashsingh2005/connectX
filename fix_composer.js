const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

code = code.replace(
  'decrypted_content: content || null',
  'decrypted_content: text || null'
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log('Fixed MessageComposer decrypted_content');
