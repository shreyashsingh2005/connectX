const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

file = file.replace(
`            isOwn
              ? 'gradient-bg text-white rounded-br-sm'
              : 'bg-gray-200 dark:bg-[#1F2937] text-gray-100 rounded-bl-sm',`,
`            isOwn
              ? 'gradient-bg text-white rounded-br-sm shadow-sm'
              : 'bg-gray-200 dark:bg-[#1F2937] text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm',`
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', file);
