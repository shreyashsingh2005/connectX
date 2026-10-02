const fs = require('fs');
let c = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');
c = c.replace(/#F97316' \}\}\}/g, "#F97316' }}");
fs.writeFileSync('src/components/chat/MessageComposer.tsx', c);
