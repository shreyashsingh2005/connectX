const fs = require('fs');

let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// 1. Update outer div border radius
code = code.replace(/rounded-\[16px\]/g, 'rounded-[24px]');

// 2. Change Paperclip to Plus in the attachment button
code = code.replace(/<Paperclip size=\{18\}/g, '<Plus size={20}');

// 3. Make Microphone purple when empty
code = code.replace(
  /bg-\[\#F8FAFC\] dark:bg-\[\#151922\] text-\[\#667085\] hover:text-\[\#101828\] dark:text-\[\#98A2B3\] dark:hover:text-\[\#F5F7FA\] hover:bg-\[\#EAECF0\] dark:hover:bg-\[\#252A34\]/g,
  'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] shadow-sm shadow-[#8B5CF6]/20'
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log("Updated MessageComposer styles");
