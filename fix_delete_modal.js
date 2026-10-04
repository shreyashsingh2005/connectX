const fs = require('fs');

let content = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

// Update modal container and animation
content = content.replace(
  /<div className="fixed inset-0 z-\[100\] flex items-center justify-center bg-black\/50 backdrop-blur-sm px-4">/,
  '<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-150">'
);
content = content.replace(
  /<div className="bg-bg-surface w-full max-w-sm rounded-\[16px\] p-6 shadow-xl border border-border-subtle border-border-subtle">/,
  '<div className="bg-bg-surface w-[calc(100vw-32px)] md:w-full max-w-sm rounded-[18px] p-6 shadow-xl border border-border-subtle animate-in zoom-in-[0.98] duration-150 ease-out">'
);

fs.writeFileSync('src/components/chat/MessageList.tsx', content);
console.log('Updated MessageList delete modal');
