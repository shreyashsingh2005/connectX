const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// Container max-width and radius
code = code.replace(
  /max-w-\[85%\] md:max-w-\[75%\]/g,
  'max-w-[80%] md:max-w-[70%]'
);

// Incoming / Outgoing specific radii
code = code.replace(
  /rounded-\[18px\]/g,
  'rounded-[16px]'
);

code = code.replace(
  /rounded-\[14px\] rounded-br-\[4px\]/g,
  'rounded-[16px] rounded-br-[4px]'
);
code = code.replace(
  /rounded-\[14px\] rounded-r-\[4px\]/g,
  'rounded-[16px] rounded-r-[4px]'
);
code = code.replace(
  /rounded-\[14px\] rounded-bl-\[4px\]/g,
  'rounded-[16px] rounded-bl-[4px]'
);
code = code.replace(
  /rounded-\[14px\] rounded-l-\[4px\]/g,
  'rounded-[16px] rounded-l-[4px]'
);

// Bubble padding (make it slightly more compact)
code = code.replace(
  /'relative px-3\.5 py-2\.5 message-animate max-w-full shadow-sm',/g,
  "'relative px-3.5 py-2 message-animate max-w-full shadow-sm shadow-black/5 dark:shadow-none',"
);

// Timestamp
code = code.replace(
  /text-\[11px\]/g,
  'text-[10px]'
);

// System messages
code = code.replace(
  /max-w-\[85%\] md:max-w-\[75%\] rounded-\[18px\] px-4 py-2\.5 italic text-gray-500 text-sm border/g,
  'max-w-[80%] md:max-w-[70%] rounded-[16px] px-4 py-2 italic text-gray-500 dark:text-[#737C86] text-[12px] border'
);

// Edit icon / Pin icon logic
// We should make the menu button compact too.
code = code.replace(
  /w-7 h-7 rounded-lg/g,
  'w-6 h-6 rounded-md'
);
code = code.replace(
  /w-4 h-4/g,
  'w-3.5 h-3.5'
);
// Ticks
code = code.replace(
  /<Check className="w-3\.5 h-3\.5"/g,
  '<Check className="w-3 h-3"'
);
code = code.replace(
  /<CheckCheck className="w-3\.5 h-3\.5"/g,
  '<CheckCheck className="w-3 h-3"'
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', code);
console.log('MessageBubble visual patched');
