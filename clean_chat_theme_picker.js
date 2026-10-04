const fs = require('fs');

let code = fs.readFileSync('src/components/chat/ChatThemePicker.tsx', 'utf8');

// Fix duplicate borders
code = code.replace(/border-border-subtle border-border-subtle/g, 'border-border-subtle');

fs.writeFileSync('src/components/chat/ChatThemePicker.tsx', code);
console.log("ChatThemePicker cleaned");
