const fs = require('fs');
let file = fs.readFileSync('src/hooks/useConversations.ts', 'utf8');

file = file.replace(
`          last_message:messages(id, content, type, created_at, sender_id, is_deleted)
        \`)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false })
        .limit(1, { foreignTable: 'messages' });`,
`          last_message:messages!fk_last_message(id, content, type, created_at, sender_id, is_deleted)
        \`)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false });`
);

fs.writeFileSync('src/hooks/useConversations.ts', file);
