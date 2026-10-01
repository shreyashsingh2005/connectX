const fs = require('fs');
let text = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf-8');

text = text.replace(
  'absolute bottom-[100%] right-4 mb-2 z-[50] shadow-2xl rounded-xl overflow-hidden',
  'absolute bottom-[100%] right-0 md:right-4 mb-2 z-[50] shadow-xl rounded-[12px] overflow-hidden'
);
text = text.replace('w-[36px] h-[36px]', 'w-9 h-9'); // just to normalize to standard tailwind
fs.writeFileSync('src/components/chat/MessageComposer.tsx', text);
