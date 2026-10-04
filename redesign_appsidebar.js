const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// AppSidebar container
code = code.replace(
  /className=\{cn\("md:flex flex-row md:flex-col items-center justify-between md:justify-start w-full md:w-\[68px\] h-\[64px\] md:h-full bg-\[\#FFFFFF\] dark:bg-\[\#090B10\] border-t md:border-t-0 md:border-r border-\[\#EAECF0\] dark:border-\[\#252A34\] py-2 md:py-6 flex-shrink-0 z-\[100\] fixed bottom-0 left-0 md:relative px-6 md:px-0 transition-transform duration-150", hideOnMobile \? "translate-y-full md:translate-y-0 hidden md:flex" : "translate-y-0 flex"\)\}/,
  'className={cn("md:flex flex-row md:flex-col items-center justify-between md:justify-start w-[calc(100%-24px)] mx-[12px] md:mx-0 md:w-[68px] h-[58px] md:h-full bg-white/90 dark:bg-[rgba(20,25,30,0.82)] backdrop-blur-[18px] border md:border-t-0 md:border-r border-[#EAECF0] dark:border-white/5 py-1.5 md:py-6 flex-shrink-0 z-[100] fixed bottom-[12px] md:bottom-0 left-0 md:relative px-4 md:px-0 transition-transform duration-150 rounded-[20px] md:rounded-none shadow-lg dark:shadow-none", hideOnMobile ? "translate-y-full md:translate-y-0 hidden md:flex" : "translate-y-0 flex")}'
);

// Nav buttons
code = code.replace(
  /w-10 h-10/g,
  'w-[42px] h-[42px]'
);
code = code.replace(
  /className=\{cn\([\s\n]*"w-\[42px\] h-\[42px\] flex items-center justify-center rounded-xl transition-all duration-150 relative group",[\s\n]*isActive[\s\n]*\? "bg-\[\#F3F0FF\] dark:bg-\[\#1E1A29\] text-\[\#8B5CF6\] dark:text-\[\#A78BFA\]"[\s\n]*: "text-\[\#667085\] dark:text-\[\#98A2B3\] hover:bg-\[\#F9FAFB\] dark:hover:bg-\[\#151922\] hover:text-\[\#101828\] dark:hover:text-\[\#F5F7FA\]"[\s\n]*\)\}/g,
  'className={cn("w-[42px] h-[42px] flex items-center justify-center rounded-[14px] transition-all duration-150 relative group", isActive ? "text-[#8B5CF6] dark:text-[#A78BFA]" : "text-[#667085] dark:text-[#737C86] hover:bg-[#F9FAFB] dark:hover:bg-[rgba(255,255,255,0.04)] hover:text-[#101828] dark:hover:text-[#F5F7FA]")}'
);

code = code.replace(
  /w-6 h-6/g,
  'w-5 h-5'
);

// Unread Badge
code = code.replace(
  /absolute top-1\.5 right-1\.5 w-2\.5 h-2\.5 bg-\[\#F04438\] rounded-full border-2 border-white dark:border-\[\#090B10\]/g,
  'absolute top-2 right-2 w-2 h-2 bg-[#8B5CF6] rounded-full border border-white dark:border-[#14191E]'
);

// User Avatar in Sidebar
code = code.replace(
  /className="w-\[32px\] h-\[32px\] rounded-full object-cover/g,
  'className="w-[28px] h-[28px] rounded-full object-cover'
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code);
console.log('AppSidebar visual patched');
