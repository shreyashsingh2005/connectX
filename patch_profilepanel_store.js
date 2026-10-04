const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

code = code.replace(
  'toast.success(\'Unpinned message\');',
  'require(\'@/store/useChatStore\').useChatStore.getState().removePinnedMessageId(conversationId, pm.message_id);\n              toast.success(\'Unpinned message\');'
);

fs.writeFileSync('src/components/chat/ProfilePanel.tsx', code);
console.log('ProfilePanel patched');
