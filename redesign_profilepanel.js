const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

// Container
code = code.replace(
  /className="w-full md:w-\[320px\] lg:w-\[360px\] h-full flex flex-col bg-white dark:bg-\[\#11141A\] border-l border-\[\#EAECF0\] dark:border-\[\#252A34\] flex-shrink-0 absolute md:relative right-0 z-40 transition-transform duration-300"/,
  'className="w-full md:w-[320px] lg:w-[360px] h-full flex flex-col bg-white/95 dark:bg-[#0B0F12]/95 backdrop-blur-[18px] border-l border-[#EAECF0] dark:border-white/5 flex-shrink-0 absolute md:relative right-0 z-40 transition-transform duration-300"'
);

// Header border
code = code.replace(
  /className="flex items-center gap-3 px-4 py-3\.5 border-b border-\[\#EAECF0\] dark:border-\[\#252A34\] bg-white\/80 dark:bg-\[\#11141A\]\/80 backdrop-blur-xl flex-shrink-0 min-h-\[64px\]"/,
  'className="flex items-center gap-3 px-4 py-3.5 border-b border-[#EAECF0] dark:border-white/5 bg-white/80 dark:bg-transparent backdrop-blur-[18px] flex-shrink-0 min-h-[64px]"'
);

// Sections
code = code.replace(
  /border-b border-\[\#EAECF0\] dark:border-\[\#252A34\]/g,
  'border-b border-[#EAECF0] dark:border-white/5'
);

// Text
code = code.replace(
  /text-\[\#101828\] dark:text-\[\#F5F7FA\]/g,
  'text-[#101828] dark:text-[#F5F7FA]'
);
code = code.replace(
  /text-\[\#667085\] dark:text-\[\#98A2B3\]/g,
  'text-[#667085] dark:text-[#A7AFB8]'
);

// Backgrounds
code = code.replace(
  /bg-gray-50 dark:bg-\[\#151922\]/g,
  'bg-gray-50 dark:bg-[rgba(255,255,255,0.02)]'
);
code = code.replace(
  /hover:bg-gray-50 dark:hover:bg-\[\#151922\]/g,
  'hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.04)]'
);
code = code.replace(
  /hover:bg-gray-100 dark:hover:bg-\[\#1A1E29\]/g,
  'hover:bg-gray-100 dark:hover:bg-[rgba(255,255,255,0.06)]'
);

// Avatar
code = code.replace(
  /w-\[84px\] h-\[84px\]/g,
  'w-[80px] h-[80px]'
);

fs.writeFileSync('src/components/chat/ProfilePanel.tsx', code);
console.log('ProfilePanel visual patched');
