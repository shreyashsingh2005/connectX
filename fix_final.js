const fs = require('fs');
let text = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');
text = text.replace(
  /const QUICK_EMOJIS = \[[^\]]+\];/,
  "const QUICK_EMOJIS = ['\\u{1F600}', '\\u{1F602}', '\\u{2764}\\u{FE0F}', '\\u{1F525}', '\\u{1F64F}', '\\u{1F44D}'];"
);
// Replace any non-ascii garbage in the button content with the safe JSX expression
text = text.replace(
  />[\s\S]*?[^\x00-\x7F]+[\s\S]*?<\/button>/,
  '>\n                {"\\u{1F600}"}\n              </button>'
);
fs.writeFileSync('src/components/chat/MessageBubble.tsx', text, 'utf8');
