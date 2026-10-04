const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ConversationList.tsx', 'utf8');

code = code.replace(
  'const { conversations, activeId } = useChatStore();',
  'const { conversations, activeId, pinnedMessageIds } = useChatStore();'
);

code = code.replace(
  'if (filter === \'pinned\') list = list.filter(c => (c as Conversation & { is_pinned?: boolean }).is_pinned);',
  'if (filter === \'pinned\') list = list.filter(c => Object.keys(pinnedMessageIds[c.id] || {}).length > 0);'
);

code = code.replace(
  '}, [conversations, searchQuery, filter, clearedChats, activeId]);',
  '}, [conversations, searchQuery, filter, clearedChats, activeId, pinnedMessageIds]);'
);

fs.writeFileSync('src/components/chat/ConversationList.tsx', code);
console.log('ConversationList patched');
