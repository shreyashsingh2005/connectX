const fs = require('fs');

let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// Icons to 18px
code = code.replace(/<Plus size=\{20\}/g, '<Plus size={18}');
code = code.replace(/<Smile size=\{20\}/g, '<Smile size={18}');
code = code.replace(/<Mic size=\{20\}/g, '<Mic size={18}');
code = code.replace(/<Square size=\{16\}/g, '<Square size={14}');
code = code.replace(/<Send size=\{18\}/g, '<Send size={18}');

// Buttons from w-[42px] h-[42px] to w-[40px] h-[40px]
code = code.replace(/w-\[42px\] h-\[42px\]/g, 'w-[40px] h-[40px]');
code = code.replace(/w-\[36px\] h-\[36px\]/g, 'w-[34px] h-[34px]'); // smaller inner buttons if any

// Form wrapper radius is already rounded-[26px], which matches the 24-26px spec.
// Let's clean up double borders
code = code.replace(/border-border-subtle border-border-subtle/g, 'border-border-subtle');

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code);
console.log("MessageComposer fixed");
