const fs = require('fs');

let code = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

code = code.replace(
  /bg-white dark:bg-\[#0B0F19\]/g,
  "bg-white dark:bg-[#0E1015]"
);
code = code.replace(
  /bg-gray-100 dark:bg-\[#11141A\]/g,
  "bg-[#F9FAFB] dark:bg-[#11141A]"
);
code = code.replace(
  /bg-gray-200 dark:bg-\[#151922\]/g,
  "bg-[#EAECF0] dark:bg-[#151922]"
);
code = code.replace(
  /border-gray-200 dark:border-\[#252A34\]/g,
  "border-[#EAECF0] dark:border-[#252A34]"
);
code = code.replace(
  /<OnlineIndicator[\s\S]*?\/>/,
  `<div className="flex items-center gap-1.5 mt-1 justify-center">
            <span className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600")} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isOnline ? 'online' : (otherUser?.last_seen ? formatLastSeen(otherUser.last_seen) : 'offline')}
            </span>
          </div>`
);

fs.writeFileSync('src/components/chat/ProfilePanel.tsx', code, 'utf8');
console.log("Updated ProfilePanel");
