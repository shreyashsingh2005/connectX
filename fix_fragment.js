const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

file = file.replace(
  /return \(\n\s*\{showEmojiPicker/,
  `return (\n    <>\n      {showEmojiPicker`
);

// add closing fragment
file = file.replace(
  /<\/div>\n\s*\);\n\}/,
  `</div>\n    </>\n  );\n}`
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
console.log("Fixed JSX fragment");
