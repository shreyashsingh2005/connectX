const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

code = code.replace(
  /console\.error\("\[E2EE_TRACE\] MessageList decryption FAILED for", msg\.id, innerErr\);/,
  "if (process.env.NODE_ENV === 'development') { console.error('[E2EE] Decryption failed for message', msg.id); }"
);

fs.writeFileSync('src/components/chat/MessageList.tsx', code, 'utf8');
console.log("Removed E2EE_TRACE");
