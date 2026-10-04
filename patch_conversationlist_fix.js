const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ConversationList.tsx', 'utf8');

code = code.replace(
  'const activeId = useChatStore(s => s.activeConversationId);',
  'const activeId = useChatStore(s => s.activeConversationId);\n  const pinnedMessageIds = useChatStore(s => s.pinnedMessageIds);'
);

fs.writeFileSync('src/components/chat/ConversationList.tsx', code);
console.log('ConversationList patched');
