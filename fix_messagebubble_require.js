const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// The file might already have the import, but let's check.
if (!code.includes('import { useChatStore } from \'@/store/useChatStore\';')) {
  code = code.replace(
    'import toast from \'react-hot-toast\';',
    'import toast from \'react-hot-toast\';\nimport { useChatStore } from \'@/store/useChatStore\';'
  );
}

// Remove the local require
code = code.replace(
  'const { useChatStore } = require(\'@/store/useChatStore\');',
  ''
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', code);
console.log('MessageBubble require removed');
