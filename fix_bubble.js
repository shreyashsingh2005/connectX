const fs = require('fs');

let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// 1. Max width
code = code.replace(
  /max-w-\[85%\] md:max-w-\[65%\]/g,
  "max-w-[78%] md:max-w-[65%]"
);

// 2. Margin gap for groups
code = code.replace(
  /showAvatar \? 'mt-3 mb-1' : 'mb-1'/g,
  "showAvatar ? 'mt-3 mb-0.5' : 'mb-0.5'"
);

// 3. Bubble styles
code = code.replace(
  /isOwn \? 'bg-\[#8B5CF6\] text-white rounded-br-sm shadow-sm' : 'bg-white dark:bg-\[#151922\] border border-gray-100 dark:border-\[#252A34\] text-gray-900 dark:text-\[#F5F7FA\] rounded-bl-sm shadow-sm'/g,
  "isOwn ? `bg-[#8B5CF6] text-white shadow-sm ${showAvatar ? 'rounded-[16px] rounded-br-[4px]' : 'rounded-[16px] rounded-r-[4px]'}` : `bg-[#F2F4F7] dark:bg-[#171B23] text-[#101828] dark:text-[#F5F7FA] shadow-sm ${showAvatar ? 'rounded-[16px] rounded-bl-[4px]' : 'rounded-[16px] rounded-l-[4px]'}`"
);

// 4. Reactions styling
code = code.replace(
  /className="flex items-center gap-1 px-1\.5 py-0\.5 rounded-full bg-gray-200 dark:bg-\[#151922\] border border-gray-300 dark:border-\[#252A34\] hover:bg-gray-300 dark:hover:bg-\[#2A3040\] transition-colors text-xs"/g,
  'className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#11141A] border border-gray-200 dark:border-[#252A34] hover:bg-gray-50 dark:hover:bg-[#1A1E29] transition-colors text-[11px] font-medium shadow-sm text-gray-700 dark:text-gray-300"'
);

// 5. Actions toolbar
code = code.replace(
  /className="flex items-center gap-1 p-1 bg-white dark:bg-\[#151922\] border border-gray-200 dark:border-\[#252A34\] rounded-xl shadow-lg"/g,
  'className="flex items-center gap-1 p-1 bg-white dark:bg-[#151922] border border-gray-200 dark:border-[#252A34] rounded-lg shadow-md"'
);
code = code.replace(
  /w-8 h-8 rounded-lg/g,
  "w-7 h-7 rounded-md"
);
code = code.replace(
  /<(Reply|Edit2|Trash2) className="w-4 h-4"/g,
  "<$1 className=\"w-3.5 h-3.5\""
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', code, 'utf8');
console.log("Updated MessageBubble.tsx");
