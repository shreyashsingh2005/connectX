const fs = require('fs');

let pageCode = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');
pageCode = pageCode.replace(
  /bg-white dark:bg-\[#0B0F19\]/g,
  "bg-[#FCFCFD] dark:bg-[#0E1015]"
);
fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', pageCode, 'utf8');

let headerCode = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');
headerCode = headerCode.replace(
  /<OnlineIndicator[\s\S]*?\/>/,
  `<div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600")} />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {isOnline ? 'online' : (lastSeen ? formatLastSeen(lastSeen) : 'offline')}
                </span>
              </div>`
);
headerCode = headerCode.replace(
  /bg-gray-50 dark:bg-\[#111827\]/g,
  "bg-white/80 dark:bg-[#0B0D12]/80 backdrop-blur-xl"
);
headerCode = headerCode.replace(
  /w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:bg-\[#11141A\] transition-all/g,
  "w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-[#1A1E29] transition-colors"
);
fs.writeFileSync('src/components/chat/ChatHeader.tsx', headerCode, 'utf8');

console.log("Updated ChatHeader and page");
