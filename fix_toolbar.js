const fs = require('fs');

let text = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

text = text.replace(
  /'flex items-center gap-1 self-center transition-opacity',/g,
  "'flex items-center gap-0.5 self-center transition-opacity bg-white dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] shadow-sm p-0.5 z-10',"
);

text = text.replace(
  /isOwn \? 'mr-1 flex-row-reverse' : 'ml-1'/g,
  "isOwn ? 'mr-2 flex-row-reverse' : 'ml-2'"
);

text = text.replace(
  /className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:bg-\[\#151922\] hover:text-gray-800 dark:text-gray-200 transition-all"/g,
  'className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"'
);

text = text.replace(
  /className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:bg-\[\#151922\] transition-all text-base"/g,
  'className="w-7 h-7 rounded-[8px] flex items-center justify-center text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"'
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', text);
console.log("Toolbar redesigned");
