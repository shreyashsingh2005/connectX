const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

code = code.replace(
  /'absolute bottom-full mb-1 flex gap-1 p-2 bg-gray-100 dark:bg-\[\#11141A\] border border-gray-300 dark:border-\[\#252A34\] rounded-\[12px\] shadow-xl z-10'/g,
  "'absolute bottom-full mb-1 flex gap-1 p-2 bg-white/95 dark:bg-[#11161B]/95 backdrop-blur-[24px] border border-[#EAECF0] dark:border-white/5 rounded-[16px] shadow-xl z-10'"
);

// Reaction items
code = code.replace(
  /hover:bg-gray-300 dark:hover:bg-\[\#252A34\]/g,
  'hover:bg-gray-100 dark:hover:bg-[rgba(255,255,255,0.06)]'
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', code);
console.log('MessageBubble reactions patched');
