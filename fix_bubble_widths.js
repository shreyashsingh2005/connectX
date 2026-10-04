const fs = require('fs');

let bubble = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// The main max widths
bubble = bubble.replace(
  /max-w-\[82%\] md:max-w-\[74%\]/g,
  'max-w-[90%] sm:max-w-[85%] md:max-w-[78%] lg:max-w-[72%]'
);

// We should also make sure long words wrap: `break-words whitespace-pre-wrap` is already there, but let's ensure overflow-wrap: anywhere for extremely long links.
bubble = bubble.replace(
  /whitespace-pre-wrap break-words/g,
  'whitespace-pre-wrap break-words [word-break:break-word]'
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', bubble);
console.log('Updated MessageBubble max-widths');
