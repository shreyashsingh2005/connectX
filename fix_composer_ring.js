const fs = require('fs');

let composer = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

composer = composer.replace(
  /focus-within:ring-\[3px\] focus-within:ring-\[#8B5CF6\]\/15/g,
  'focus-within:ring-[2px] focus-within:ring-[#8B5CF6]/20 hover:border-brand/30'
);

// Typing indicator "subtle animated dots, no oversized bubble" -> handled by earlier fix (TypingIndicator.tsx is subtle)

fs.writeFileSync('src/components/chat/MessageComposer.tsx', composer);
console.log('Updated MessageComposer focus ring');
