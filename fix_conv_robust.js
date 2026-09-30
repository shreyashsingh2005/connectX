const fs = require('fs');
let file = fs.readFileSync('src/components/chat/ConversationList.tsx', 'utf8');

// We want to safely replace getLastMessagePreview
const originalFuncStart = "function getLastMessagePreview(conv: Conversation) {";
const originalFuncEnd = "return <DecryptedPreview content={msg.content || ''} conversationId={conv.id} />;\n    }";

const newFunc = `
    function getLastMessagePreview(conv: Conversation) {
      const clearedAt = clearedChats[conv.id];
      if (conv.last_message && deletedLocalIds.includes(conv.last_message.id)) return 'No messages yet';
      if (clearedAt && conv.last_message && new Date(conv.last_message.created_at) <= new Date(clearedAt)) {
        return 'No messages yet';
      }

      if (!conv.last_message) return 'No messages yet';
      const msg = conv.last_message;
      if (msg.is_deleted) return 'Message deleted'; // removed emoji to avoid encoding bugs
      if (msg.type !== 'text' && msg.type !== 'system') {
        return msg.type === 'image' ? 'Image' :
               msg.type === 'video' ? 'Video' :
               msg.type === 'audio' ? 'Audio' : 'File';
      }
      return <DecryptedPreview content={msg.content || ''} conversationId={conv.id} />;
    }
`;

// use regex to replace between the boundaries safely
file = file.replace(
  /function getLastMessagePreview\(conv: Conversation\) \{[\s\S]*?return <DecryptedPreview content=\{msg\.content \|\| ''\} conversationId=\{conv\.id\} \/>;\n\s*\}/,
  newFunc.trim()
);

// We also need to hide the time!
const timeRegex = /const lastMsgTime = conv\.last_message_at \? formatConversationTime\(conv\.last_message_at\) : '';/;
const newTimeLogic = `
              const clearedAt = clearedChats[conv.id];
              const isCleared = clearedAt && conv.last_message_at && new Date(conv.last_message_at) <= new Date(clearedAt);
              const lastMsgTime = (!isCleared && conv.last_message_at) ? formatConversationTime(conv.last_message_at) : '';
`;
file = file.replace(timeRegex, newTimeLogic.trim());

fs.writeFileSync('src/components/chat/ConversationList.tsx', file);
console.log("Fixed ConversationList rendering robustly");
