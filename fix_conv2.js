const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ConversationList.tsx', 'utf8');

// Update main background
code = code.replace(
  /className="w-full md:w-\[320px\] lg:w-\[380px\] h-full flex flex-col bg-white dark:bg-\[#0E1015\] border-r border-gray-200 dark:border-\[#252A34\] flex-shrink-0"/,
  'className="w-full md:w-[320px] lg:w-[350px] h-full flex flex-col bg-[#FFFFFF] dark:bg-[#11141A] border-r border-[#EAECF0] dark:border-[#252A34] flex-shrink-0"'
);

// Update header bg
code = code.replace(
  /bg-gray-50 dark:bg-\[#111827\]/,
  'bg-transparent'
);

// Update search input
code = code.replace(
  /bg-gray-100 dark:bg-\[#11141A\] border border-gray-200 dark:border-\[#252A34\]/,
  'bg-[#F9FAFB] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34]'
);

// Update Tabs container
code = code.replace(
  /bg-gray-100 dark:bg-\[#11141A\]/g,
  'bg-[#F9FAFB] dark:bg-[#151922]'
);

// Update conversation hover
code = code.replace(
  /hover:bg-gray-50 dark:hover:bg-\[#151922\]\/60/g,
  'hover:bg-[#F9FAFB] dark:hover:bg-[#151922]/80'
);

fs.writeFileSync('src/components/chat/ConversationList.tsx', code, 'utf8');
console.log("Updated ConversationList");
