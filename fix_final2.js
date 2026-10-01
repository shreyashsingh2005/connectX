const fs = require('fs');
let t = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

t = t.replace(
  /const QUICK_EMOJIS = \[[^\]]+\];/,
  "const QUICK_EMOJIS = ['\\u{2764}\\u{FE0F}', '\\u{1F602}', '\\u{1F44D}', '\\u{1F62E}', '\\u{1F622}', '\\u{1F64F}'];"
);

// We need to fix the quick emoji button which I know contains invalid characters:
t = t.replace(
  /className="w-7 h-7 rounded-\[8px\] flex items-center justify-center text-gray-500 hover:bg-black\/5 dark:hover:bg-white\/5 hover:text-gray-900 dark:hover:text-white transition-all"\s*>\s*[^\s<]+\s*<\/button>/,
  `className="w-7 h-7 rounded-[8px] flex items-center justify-center text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"\n              >\n                {"\\u{1F600}"}\n              </button>`
);

t = t.replace("Ã°Å¸Å¡Â«", "{\\u{1F6AB}}");
t = t.replace("Ã°Å¸â€œÅ½", "{\\u{1F4CE}}");

fs.writeFileSync('src/components/chat/MessageBubble.tsx', t, 'utf8');
