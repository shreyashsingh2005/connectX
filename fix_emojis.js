const fs = require('fs');

let text = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// The corrupted array
text = text.replace(
  /const QUICK_EMOJIS = \[[^\]]+\];/,
  "const QUICK_EMOJIS = ['😀', '😂', '❤️', '🔥', '🙏', '👍'];"
);

// The corrupted button emoji A,Eo
text = text.replace(
  />\s*A\\,Eo\\s*<\/button>/g,
  '>\n                😀\n              </button>'
);

// Fallback regex for that button if the above one doesn't match
text = text.replace(
  />\s*[A-Za-z0-9,~_?]+s?\s*<\/button>/g,
  '>\n                😀\n              </button>'
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', text, 'utf8');
console.log("Emojis restored in MessageBubble.tsx!");
