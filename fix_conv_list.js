const fs = require('fs');

let code = fs.readFileSync('src/components/chat/ConversationList.tsx', 'utf8');
code = code.replace(
  /className="flex flex-col h-full bg-bg-surface border-r border-border-subtle border-border-subtle w-full md:w-\[320px\] flex-shrink-0"/g,
  'className="flex flex-col h-full w-full bg-bg-surface flex-shrink-0"'
);
fs.writeFileSync('src/components/chat/ConversationList.tsx', code);
console.log("ConversationList.tsx updated.");
