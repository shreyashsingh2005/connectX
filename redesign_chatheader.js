const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');

// Header background and border
code = code.replace(
  /className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-\[\#252A34\] bg-white\/80 dark:bg-\[\#0B0D12\]\/80 backdrop-blur-xl flex-shrink-0 min-h-\[64px\] relative z-50"/,
  'className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0B0F12]/80 backdrop-blur-[18px] flex-shrink-0 min-h-[56px] md:min-h-[64px] relative z-50 shadow-sm dark:shadow-none"'
);

// Call buttons
code = code.replace(
  /className="w-\[36px\] h-\[36px\] rounded-full flex items-center justify-center text-\[\#667085\] dark:text-\[\#98A2B3\] hover:text-\[\#101828\] dark:hover:text-\[\#F5F7FA\] hover:bg-\[\#F9FAFB\] dark:hover:bg-\[\#1A1E29\] transition-colors"/g,
  'className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[#667085] dark:text-[#A7AFB8] hover:text-[#101828] dark:hover:text-[#F5F7FA] hover:bg-[#F9FAFB] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"'
);

// More button
code = code.replace(
  /className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-\[\#1A1E29\] transition-colors relative"/,
  'className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[#667085] dark:text-[#A7AFB8] hover:bg-[#F9FAFB] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors relative"'
);

// Dropdown menu
code = code.replace(
  /className="absolute right-0 mt-2 w-48 bg-white dark:bg-\[\#151922\] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden"/,
  'className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#11161B] border border-gray-200 dark:border-white/5 rounded-[16px] shadow-lg z-50 overflow-hidden"'
);

// Menu item
code = code.replace(
  /className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-\[\#111827\] transition-colors"/,
  'className="w-full text-left px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-[#F5F7FA] hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"'
);

// Menu divider
code = code.replace(
  /className="h-\[1px\] w-full bg-gray-100 dark:bg-gray-700" \//,
  'className="h-[1px] w-full bg-gray-100 dark:bg-white/5" /'
);

// Menu Clear Chat
code = code.replace(
  /className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900\/20 transition-colors"/,
  'className="w-full text-left px-4 py-3 text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"'
);

// Last seen text
code = code.replace(
  /className="text-\[13px\] font-medium text-gray-500 dark:text-gray-400"/,
  'className="text-[12px] font-medium text-gray-500 dark:text-[#737C86]"'
);

fs.writeFileSync('src/components/chat/ChatHeader.tsx', code);
console.log('ChatHeader visual patched');
