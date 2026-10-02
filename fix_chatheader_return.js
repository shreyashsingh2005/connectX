const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');

// Revert the bad <> injection
code = code.replace(
  "return (\n    <>) => document.removeEventListener",
  "return () => document.removeEventListener"
);

// Inject <> into the main return
code = code.replace(
  "return (\n    <header",
  "return (\n    <>\n    <header"
);

fs.writeFileSync('src/components/chat/ChatHeader.tsx', code, 'utf8');
