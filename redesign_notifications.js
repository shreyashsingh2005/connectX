const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/notifications/page.tsx', 'utf8');

// Global Background
code = code.replace(
  /bg-\[\#F8FAFC\] dark:bg-\[\#090B10\]/g,
  'bg-white dark:bg-[#0B0F12]'
);
code = code.replace(
  /bg-\[\#F8FAFC\] dark:bg-\[\#0B0D12\]/g,
  'bg-white dark:bg-[#0B0F12]'
);

// Row item
code = code.replace(
  /bg-\[\#FFFFFF\] dark:bg-\[\#151922\]/g,
  'bg-white dark:bg-[rgba(255,255,255,0.06)]'
);
code = code.replace(
  /hover:bg-\[\#FFFFFF\] dark:hover:bg-\[\#11141A\]/g,
  'hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.02)]'
);
code = code.replace(
  /dark:hover:border-\[\#252A34\]/g,
  'dark:hover:border-white/5'
);

// Text
code = code.replace(
  /text-\[\#101828\] dark:text-\[\#F5F7FA\]/g,
  'text-[#101828] dark:text-[#F5F7FA]'
);
code = code.replace(
  /text-\[\#344054\] dark:text-\[\#D0D5DD\]/g,
  'text-[#344054] dark:text-[#F5F7FA]'
);
code = code.replace(
  /text-\[\#667085\] dark:text-\[\#98A2B3\]/g,
  'text-[#667085] dark:text-[#A7AFB8]'
);

fs.writeFileSync('src/app/(app)/notifications/page.tsx', code);
console.log('Notifications visual patched');
