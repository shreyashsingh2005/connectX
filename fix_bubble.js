const fs = require('fs');

let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// 1. Update radii logic
code = code.replace(
  /isOwn \? `bg-\[\#8B5CF6\] text-white shadow-sm \$\{showAvatar \? 'rounded-\[16px\] rounded-br-\[4px\]' : 'rounded-\[16px\] rounded-r-\[4px\]'\}` : `bg-\[\#F2F4F7\] dark:bg-\[\#171B23\] text-\[\#101828\] dark:text-\[\#F5F7FA\] shadow-sm \$\{showAvatar \? 'rounded-\[16px\] rounded-bl-\[4px\]' : 'rounded-\[16px\] rounded-l-\[4px\]'\}`/g,
  "isOwn ? `bg-[#8B5CF6] text-white shadow-sm ${showAvatar ? 'rounded-[18px] rounded-br-[5px]' : 'rounded-[18px] rounded-r-[5px]'}` : `bg-[#FFFFFF] dark:bg-[#171B23] text-[#101828] dark:text-[#F5F7FA] shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-[#EAECF0] dark:border-[#252A34] ${showAvatar ? 'rounded-[18px] rounded-bl-[5px]' : 'rounded-[18px] rounded-l-[5px]'}`"
);

// 2. Also update the general bubble shape block just in case
code = code.replace(/rounded-\[16px\]/g, 'rounded-[18px]');

// 3. Update grouping margin. "Group consecutive messages from the same sender. Reduce vertical spacing between grouped messages."
// Currently: showAvatar ? 'mt-3 mb-0.5' : 'mb-0.5'
code = code.replace(/showAvatar \? 'mt-3 mb-0\.5' : 'mb-0\.5'/g, "showAvatar ? 'mt-4 mb-0.5' : 'mb-[2px]'");

// 4. Update the receipt logic to place it inside the bubble for outgoing
// Actually, it's currently rendered next to the timestamp. We can ensure the timestamp and receipt are small (10-11px).
// Let's check where formatMessageTime is used.
code = code.replace(/<span className="text-\[10px\] opacity-70 ml-1">/g, '<span className="text-[11px] opacity-70 ml-2 mt-1">');

fs.writeFileSync('src/components/chat/MessageBubble.tsx', code, 'utf8');
console.log("Updated MessageBubble styles");
