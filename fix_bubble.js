const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

code = code.replace(/max-w-\[78\%\] md:max-w-\[65\%\]/g, 'max-w-[85%] md:max-w-[75%]');

code = code.replace(/<p className="whitespace-pre-wrap break-words leading-relaxed text-\[14px\]">/g, '<p className="whitespace-pre-wrap break-words leading-relaxed text-[14px]" style={{ wordBreak: "break-word" }}>');

fs.writeFileSync('src/components/chat/MessageBubble.tsx', code, 'utf8');
console.log('Fixed MessageBubble max-width');
