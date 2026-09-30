const fs = require('fs');
let file = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');

file = file.replace(
  /localStorage\.setItem\('cleared_chats', JSON\.stringify\(clearedChats\)\);/,
  `localStorage.setItem('cleared_chats', JSON.stringify(clearedChats));\n        window.dispatchEvent(new Event('chat_cleared'));`
);

fs.writeFileSync('src/components/chat/ChatHeader.tsx', file);
console.log("Added chat_cleared event");
