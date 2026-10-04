const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Global Background
code = code.replace(
  /bg-\[\#F7F8FA\] dark:bg-\[\#090B10\]/g,
  'bg-[#F6F7F9] dark:bg-[#0B0F12]'
);

// Card Surface
code = code.replace(
  /bg-\[\#FFFFFF\] dark:bg-\[\#11141A\] rounded-\[16px\] border border-\[\#EAECF0\] dark:border-\[\#252A34\]/g,
  'bg-white dark:bg-[#11161B] rounded-[16px] border border-[#EAECF0] dark:border-white/5 shadow-sm dark:shadow-none'
);

// Hover states
code = code.replace(
  /hover:bg-\[\#F9FAFB\] dark:hover:bg-\[\#1A1F2B\]/g,
  'hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.02)]'
);

// Text colors
code = code.replace(
  /text-\[\#101828\] dark:text-\[\#F5F7FA\]/g,
  'text-[#101828] dark:text-[#F5F7FA]'
);
code = code.replace(
  /text-\[\#667085\] dark:text-\[\#98A2B3\]/g,
  'text-[#667085] dark:text-[#A7AFB8]'
);

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log('Settings page visual patched');
