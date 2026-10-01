const fs = require('fs');
let text = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

text = text.replace(
  /const QUICK_EMOJIS = \[[^\]]+\];/,
  "const QUICK_EMOJIS = ['\\u{1F600}', '\\u{1F602}', '\\u{2764}\\u{FE0F}', '\\u{1F525}', '\\u{1F64F}', '\\u{1F44D}'];"
);

text = text.replace(
  /A,Eo/g,
  "\\u{1F600}"
);
text = text.replace(
  />[\s\S]*?A,Eo[\s\S]*?<\/button>/g,
  '>\n                \\u{1F600}\n              </button>'
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', text, 'utf8');
console.log("Emojis restored using unicode escapes!");
