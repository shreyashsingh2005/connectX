const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

code = code.replace(
  '<MessageBubble key={message.id} message={message}',
  '<MessageBubble key={message.id} message={message} isPinned={!!pinnedMessageIds[conversationId]?.[message.id]}'
);

fs.writeFileSync('src/components/chat/MessageList.tsx', code);
console.log('MessageList patched with isPinned');
