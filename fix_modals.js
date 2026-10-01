const fs = require('fs');

const files = [
  'src/components/modals/NewChatModal.tsx',
  'src/components/modals/GroupChatModal.tsx',
  'src/components/modals/UsernameSetupModal.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');

  // Backdrop
  code = code.replace(/bg-black\/50 backdrop-blur-sm/g, "bg-[#090B10]/80 backdrop-blur-sm");
  
  // Dialog Card Radius and Surface
  code = code.replace(/rounded-3xl|rounded-2xl/g, "rounded-[20px]");
  code = code.replace(/bg-white dark:bg-\[#111827\]/g, "bg-[#FFFFFF] dark:bg-[#11141A]");
  code = code.replace(/bg-white dark:bg-\[#151922\]/g, "bg-[#FFFFFF] dark:bg-[#11141A]");
  
  // Header and Border
  code = code.replace(/border-gray-100 dark:border-\[#252A34\]/g, "border-[#EAECF0] dark:border-[#252A34]");
  
  // Inputs inside Modal
  code = code.replace(/bg-gray-50 dark:bg-\[#0B0F19\]/g, "bg-[#F9FAFB] dark:bg-[#0B0D12]");
  code = code.replace(/rounded-xl py-3/g, "rounded-[12px] py-2.5 h-[44px]");
  
  // Cancel button
  code = code.replace(/bg-gray-100 dark:bg-\[#151922\] hover:bg-gray-200 dark:hover:bg-\[#374151\]/g, "bg-[#F9FAFB] dark:bg-[#151922] hover:bg-[#EAECF0] dark:hover:bg-[#252A34]");
  
  fs.writeFileSync(file, code, 'utf8');
}
console.log("Updated Modals");
