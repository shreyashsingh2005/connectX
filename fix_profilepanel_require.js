const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

// Add import to top
code = code.replace(
  'import toast from \'react-hot-toast\';',
  'import toast from \'react-hot-toast\';\nimport { useChatStore } from \'@/store/useChatStore\';'
);

// Replace require with import usage
code = code.replace(
  'require(\'@/store/useChatStore\').useChatStore.getState().removePinnedMessageId(conversationId, pm.message_id);',
  'useChatStore.getState().removePinnedMessageId(conversationId, pm.message_id);'
);

fs.writeFileSync('src/components/chat/ProfilePanel.tsx', code);
console.log('ProfilePanel require removed');
