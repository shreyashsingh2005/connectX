const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

file = file.replace(
  /className="hidden sm:flex w-\[36px\] h-\[36px\] flex-shrink-0 items-center justify-center rounded-\[10px\] text-\[#667085\] hover:text-\[#101828\] dark:text-\[#98A2B3\] dark:hover:text-\[#F5F7FA\] hover:bg-\[#F8FAFC\] dark:hover:bg-\[#151922\] transition-colors"/,
  `className="flex w-[36px] h-[36px] flex-shrink-0 items-center justify-center rounded-[10px] text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] hover:bg-[#F8FAFC] dark:hover:bg-[#151922] transition-colors"`
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
console.log("Made emoji button visible on mobile");
