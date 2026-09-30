const fs = require('fs');
let file = fs.readFileSync('src/components/chat/ConversationList.tsx', 'utf8');

const regex = /function getLastMessagePreview\(conv: Conversation\) \{[\s\S]*?if \(!conv\.last_message\) return 'No messages yet';/;
const replacement = `function getLastMessagePreview(conv: Conversation) {
      const clearedAt = clearedChats[conv.id];
      if (conv.last_message && deletedLocalIds.includes(conv.last_message.id)) return 'No messages yet';
      if (clearedAt && conv.last_message) {
        if (new Date(conv.last_message.created_at) <= new Date(clearedAt)) {
          return 'No messages yet';
        }
      }

      if (!conv.last_message) return 'No messages yet';`;

file = file.replace(regex, replacement);
fs.writeFileSync('src/components/chat/ConversationList.tsx', file);
console.log("Fixed getLastMessagePreview");
