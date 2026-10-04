const fs = require('fs');

let layoutCode = fs.readFileSync('src/app/(app)/layout.tsx', 'utf8');
layoutCode = layoutCode.replace(
  /bg-\[\#F7F8FC\] dark:bg-\[\#0B0D12\]/g,
  'bg-white dark:bg-[#0B0F12]'
);
fs.writeFileSync('src/app/(app)/layout.tsx', layoutCode);
console.log('App layout visual patched');

let pageCode = fs.readFileSync('src/app/(app)/chat/page.tsx', 'utf8');
pageCode = pageCode.replace(
  /bg-\[\#F8FAFC\] dark:bg-\[\#0B0D12\]/g,
  'bg-[#F6F7F9] dark:bg-[#0B0F12]'
);
pageCode = pageCode.replace(
  /bg-white dark:bg-\[\#151922\] border border-\[\#EAECF0\] dark:border-\[\#252A34\]/g,
  'bg-white dark:bg-[#11161B] border border-[#EAECF0] dark:border-white/5'
);
fs.writeFileSync('src/app/(app)/chat/page.tsx', pageCode);
console.log('Chat index visual patched');
