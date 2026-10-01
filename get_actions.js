const fs = require('fs');
const lines = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('Actions (hover)'));
console.log(lines.slice(start, start + 50).join('\n'));
