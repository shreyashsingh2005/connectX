const fs = require('fs');

let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// Radius
code = code.replace(/rounded-\[16px\]/g, 'rounded-[14px]');

// Padding
code = code.replace(/px-3\.5 py-2/g, 'px-[12px] py-[8px]');

// Ensure font 14px
code = code.replace(/text-\[14px\] leading-relaxed/g, 'text-[14px] leading-[1.4]');

// Clean up duplicate border classes just in case
code = code.replace(/border border-border-subtle/g, 'border-border-subtle');

fs.writeFileSync('src/components/chat/MessageBubble.tsx', code);
console.log("MessageBubble fixed");
