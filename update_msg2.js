const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

file = file.replace(
`    if (messages.length === 0) {
      return <div className="flex-1 flex items-center justify-center"><EmptyState variant="no-messages" /></div>;
    }`,
`    if (fetchError) {
      return <div className="flex-1 flex items-center justify-center text-red-500 font-mono text-sm p-4 text-center">{fetchError}</div>;
    }
    if (messages.length === 0) {
      return <div className="flex-1 flex items-center justify-center"><EmptyState variant="no-messages" /></div>;
    }`
);

fs.writeFileSync('src/components/chat/MessageList.tsx', file);
