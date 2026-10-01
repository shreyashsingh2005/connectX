const fs = require('fs');

let code = fs.readFileSync('src/components/chat/ConversationList.tsx', 'utf8');

// 1. Update Header Buttons
code = code.replace(
  /w-\[32px\] h-\[32px\]/g,
  "w-[36px] h-[36px]"
);

// 2. Update Search Input
code = code.replace(
  /py-2 pl-10 pr-4 text-sm/g,
  "py-2 h-[42px] pl-10 pr-4 text-[14px] rounded-[10px]"
);

// 3. Update Tabs to segmented controls
code = code.replace(
  /<div className="flex gap-2 mt-3">[\s\S]*?<\/div>/,
  `<div className="flex bg-gray-100 dark:bg-[#11141A] p-1 rounded-[10px] mt-4">
          {(['all', 'unread', 'pinned'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 text-[13px] py-1.5 rounded-lg font-medium transition-all duration-150 capitalize flex items-center justify-center gap-1.5',
                filter === f
                  ? 'bg-white dark:bg-[#252A34] text-gray-900 dark:text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] bg-transparent'
              )}
            >
              {f === 'pinned' ? <Pin className="w-3.5 h-3.5" /> : null}
              {f}
            </button>
          ))}
        </div>`
);

// 4. Update Conversation Item active state
code = code.replace(
  /isActive\s*\?\s*'bg-gray-100 dark:bg-\[#151922\] border-l-2 border-\[#8B5CF6\]'\s*:\s*'hover:bg-gray-50 dark:hover:bg-\[#151922\] bg-transparent border-l-2 border-transparent'/,
  `isActive
                    ? 'bg-gray-100/80 dark:bg-[#151922] before:absolute before:left-0 before:top-[10%] before:h-[80%] before:w-[3px] before:bg-[#8B5CF6] before:rounded-r-md'
                    : 'hover:bg-gray-50 dark:hover:bg-[#151922]/60 bg-transparent'`
);
code = code.replace(
  /'w-full flex items-center gap-3 px-3 py-2\.5 transition-all text-left group relative',/,
  `'w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left group relative',`
);

// 5. Update typography hierarchy
code = code.replace(
  /font-medium text-sm truncate/g,
  `font-semibold text-[14px] truncate`
);
code = code.replace(
  /text-\[12px\] whitespace-nowrap ml-2/g,
  `text-[11px] font-medium whitespace-nowrap ml-2`
);
code = code.replace(
  /text-\[13px\] truncate leading-tight mt-0\.5/g,
  `text-[13px] font-normal truncate mt-0.5`
);
// Avatar size
code = code.replace(
  /size="sm"/g,
  `size="md"`
);

fs.writeFileSync('src/components/chat/ConversationList.tsx', code, 'utf8');
console.log("Updated ConversationList.tsx");
