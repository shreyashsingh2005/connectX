const fs = require('fs');
let text = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

text = text.replace(
  /\\u\{1F600\}/g,
  "😀"
);
text = text.replace(
  /\\u\{1F602\}/g,
  "😂"
);
text = text.replace(
  /\\u\{2764\}\\u\{FE0F\}/g,
  "❤️"
);
text = text.replace(
  /\\u\{1F525\}/g,
  "🔥"
);
text = text.replace(
  /\\u\{1F64F\}/g,
  "🙏"
);
text = text.replace(
  /\\u\{1F44D\}/g,
  "👍"
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', text, 'utf8');
console.log("Replaced unicode escapes with literal emojis");
