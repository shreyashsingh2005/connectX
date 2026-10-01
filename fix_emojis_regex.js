const fs = require('fs');
let text = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

const regex = /className="w-7 h-7 rounded-\[8px\] flex items-center justify-center text-gray-500 hover:bg-black\/5 dark:hover:bg-white\/5 hover:text-gray-900 dark:hover:text-white transition-all"\s*>\s*[^<]+\s*<\/button>/g;

text = text.replace(regex, `className="w-7 h-7 rounded-[8px] flex items-center justify-center text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"\n              >\n                \\u{1F600}\n              </button>`);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', text, 'utf8');
console.log("Emojis restored in MessageBubble.tsx via regex!");
