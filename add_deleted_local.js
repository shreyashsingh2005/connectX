const fs = require('fs');
let file = fs.readFileSync('src/components/chat/ConversationList.tsx', 'utf8');

file = file.replace(
  /const \[clearedChats, setClearedChats\] = useState<Record<string, string>>\(\{\}\);/,
  `const [clearedChats, setClearedChats] = useState<Record<string, string>>({});\n  const [deletedLocalIds, setDeletedLocalIds] = useState<string[]>([]);`
);

file = file.replace(
  /setClearedChats\(JSON\.parse\(localStorage\.getItem\('cleared_chats'\) \|\| '\{\}'\)\);/,
  `setClearedChats(JSON.parse(localStorage.getItem('cleared_chats') || '{}'));\n        setDeletedLocalIds(JSON.parse(localStorage.getItem('deleted_messages') || '[]'));`
);

file = file.replace(
  /const clearedAt = clearedChats\[conv\.id\];/,
  `const clearedAt = clearedChats[conv.id];\n      if (conv.last_message && deletedLocalIds.includes(conv.last_message.id)) return 'No messages yet';`
);

fs.writeFileSync('src/components/chat/ConversationList.tsx', file);
console.log("Added deletedLocalIds check");
