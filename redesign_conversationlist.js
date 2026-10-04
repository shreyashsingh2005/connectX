const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ConversationList.tsx', 'utf8');

// Container
code = code.replace(
  /className="flex flex-col h-full bg-\[\#FFFFFF\] dark:bg-\[\#11141A\] border-r border-\[\#EAECF0\] dark:border-\[\#252A34\] w-full md:w-\[320px\] flex-shrink-0"/,
  'className="flex flex-col h-full bg-white dark:bg-[#0B0F12] border-r border-[#EAECF0] dark:border-white/5 w-full md:w-[320px] flex-shrink-0"'
);

// Search input
code = code.replace(
  /className="w-full bg-\[\#F9FAFB\] dark:bg-\[\#151922\] border border-\[\#EAECF0\] dark:border-\[\#252A34\] rounded-\[10px\] py-2 h-\[42px\] pl-10 pr-4 text-\[14px\] text-gray-900 dark:text-white placeholder-\[\#667085\] focus:outline-none focus:border-\[\#8B5CF6\]\/50 focus:ring-1 focus:ring-\[\#8B5CF6\]\/20 transition-all"/,
  'className="w-full bg-[#F9FAFB] dark:bg-[#11161B] border border-[#EAECF0] dark:border-white/5 rounded-full py-2 h-[40px] pl-10 pr-4 text-[13px] text-gray-900 dark:text-white placeholder-[#737C86] focus:outline-none focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/20 transition-all shadow-sm dark:shadow-none"'
);

// Unread Badge
code = code.replace(
  /className="flex-shrink-0 min-w-\[20px\] h-\[20px\] rounded-full bg-\[\#101828\] dark:bg-\[\#F5F7FA\] text-white dark:text-\[\#101828\] text-\[10px\] font-bold flex items-center justify-center px-1"/g,
  'className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#8B5CF6] text-white text-[10px] font-bold flex items-center justify-center px-1"'
);

// Row Hover
code = code.replace(
  /isActive[\s\n]*\? 'bg-\[\#F1F3F5\] dark:bg-\[\#1A1F2B\]'[\s\n]*: 'hover:bg-\[\#F1F3F5\] dark:hover:bg-\[\#1A1F2B\] bg-transparent'/g,
  `isActive ? 'bg-[#F1F3F5] dark:bg-[rgba(255,255,255,0.04)]' : 'hover:bg-[#F1F3F5] dark:hover:bg-[rgba(255,255,255,0.02)] bg-transparent'`
);

// Row Separator (subtle border bottom)
code = code.replace(
  /className=\{cn\([\s\n]*'w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left group relative',/,
  `className={cn('w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left group relative border-b border-[#EAECF0] dark:border-white/5 last:border-0',`
);

// Unread text highlight
code = code.replace(
  /unreadCount > 0 \? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-\[\#667085\]'/g,
  `unreadCount > 0 ? 'text-gray-900 dark:text-[#F5F7FA] font-medium' : 'text-[#667085] dark:text-[#A7AFB8]'`
);

// Timestamp
code = code.replace(
  /<span className="text-\[11px\] text-\[\#667085\] flex-shrink-0">\{lastMsgTime\}<\/span>/,
  '<span className={cn("text-[11px] flex-shrink-0", unreadCount > 0 ? "text-[#8B5CF6]" : "text-[#667085] dark:text-[#737C86]")}>{lastMsgTime}</span>'
);

fs.writeFileSync('src/components/chat/ConversationList.tsx', code);
console.log('ConversationList visual patched');
