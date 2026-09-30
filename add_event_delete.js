const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

file = file.replace(
  /localStorage\.setItem\('deleted_messages', JSON\.stringify\(newDeleted\)\);/,
  `localStorage.setItem('deleted_messages', JSON.stringify(newDeleted));\n        window.dispatchEvent(new Event('chat_cleared'));`
);

fs.writeFileSync('src/components/chat/MessageList.tsx', file);
console.log("Dispatched chat_cleared for delete for me");
