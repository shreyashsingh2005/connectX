const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/profile/[username]/page.tsx', 'utf8');

// Global Background
code = code.replace(
  /bg-\[\#F8FAFC\] dark:bg-\[\#0B0D12\]/g,
  'bg-white dark:bg-[#0B0F12]'
);

// Card Surface
code = code.replace(
  /bg-white dark:bg-\[\#11141A\] rounded-\[24px\] border border-\[\#EAECF0\] dark:border-\[\#252A34\] shadow-sm/g,
  'bg-white dark:bg-[#11161B] rounded-[24px] border border-[#EAECF0] dark:border-white/5 shadow-sm dark:shadow-none'
);

// Avatar
code = code.replace(
  /className="w-24 h-24 md:w-32 md:h-32 ring-4 ring-white dark:ring-\[\#11141A\] shadow-sm bg-\[\#EAECF0\] dark:bg-\[\#252A34\]"/g,
  'className="w-[80px] h-[80px] ring-4 ring-white dark:ring-[#11161B] shadow-sm bg-[#EAECF0] dark:bg-white/5"'
);

// Name
code = code.replace(
  /text-\[24px\] md:text-\[28px\]/g,
  'text-[20px] md:text-[24px]'
);

// Bio text color
code = code.replace(
  /text-\[\#101828\] dark:text-\[\#F5F7FA\]/g,
  'text-[#101828] dark:text-[#F5F7FA]'
);
code = code.replace(
  /text-\[\#667085\] dark:text-\[\#98A2B3\]/g,
  'text-[#667085] dark:text-[#A7AFB8]'
);
code = code.replace(
  /text-\[\#667085\] dark:text-\[\#667085\]/g,
  'text-[#667085] dark:text-[#737C86]'
);

fs.writeFileSync('src/app/(app)/profile/[username]/page.tsx', code);
console.log('Profile page visual patched');
