const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

file = file.replace(
  /const path = \`\$\{profile!\.id\}\/\$\{messageId\}\/\$\{att\.id\}\.\$\{ext\}\`;/,
  `const path = \`\$\{conversationId\}\/\$\{messageId\}\/\$\{att\.id\}\.\$\{ext\}\`;`
);
fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
console.log("Fixed storage path");
