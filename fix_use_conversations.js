const fs = require('fs');
let file = fs.readFileSync('src/hooks/useConversations.tsx', 'utf8');

const transformLogic = `
        const currentConvs = useChatStore.getState().conversations;
        let clearedChats: Record<string, string> = {};
        let deletedLocalIds: string[] = [];
        try {
          clearedChats = JSON.parse(localStorage.getItem('cleared_chats') || '{}');
          deletedLocalIds = JSON.parse(localStorage.getItem('deleted_messages') || '[]');
        } catch (e) {}

        const enriched: Conversation[] = convData.map(conv => {
          const memberInfo = memberRows.find(m => m.conversation_id === conv.id);
          const otherMember = conv.type === 'direct'
            ? (conv.members as { user_id: string; profile: unknown }[]).find((m: { user_id: string }) => m.user_id !== profile.id)?.profile as Conversation['other_member']
            : undefined;
  
          let lastMsg = Array.isArray(conv.last_message) ? conv.last_message[0] : conv.last_message;
          
          if (lastMsg) {
             const clearedAt = clearedChats[conv.id];
             if (deletedLocalIds.includes(lastMsg.id)) {
               lastMsg = undefined;
             } else if (clearedAt && new Date(lastMsg.created_at) <= new Date(clearedAt)) {
               lastMsg = undefined;
             }
          }
`;

file = file.replace(
  /const currentConvs = useChatStore\.getState\(\)\.conversations;\n\s*const enriched: Conversation\[\] = convData\.map\(conv => \{\n\s*const memberInfo = memberRows\.find\(m => m\.conversation_id === conv\.id\);\n\s*const otherMember = conv\.type === 'direct'\n\s*\? \(conv\.members as \{ user_id: string; profile: unknown \}\[\]\)\.find\(\(m: \{ user_id: string \}\) => m\.user_id !== profile\.id\)\?\.profile as Conversation\['other_member'\]\n\s*: undefined;\n\n\s*const lastMsg = Array\.isArray\(conv\.last_message\) \? conv\.last_message\[0\] : conv\.last_message;/,
  transformLogic.trim()
);

fs.writeFileSync('src/hooks/useConversations.tsx', file);
console.log("Updated useConversations last_message filter");
