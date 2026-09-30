const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

const lines = file.split('\n');
const lastClosingBrace = lines.findLastIndex(l => l.trim() === '}');
if (lastClosingBrace !== -1) {
    lines[lastClosingBrace] = `}, (prev, next) => {
  return (
    prev.message === next.message &&
    prev.isOwn === next.isOwn &&
    prev.showAvatar === next.showAvatar &&
    prev.showSender === next.showSender &&
    prev.currentUserId === next.currentUserId
  );
});`;
}

fs.writeFileSync('src/components/chat/MessageBubble.tsx', lines.join('\n'));
console.log("Fixed MessageBubble");
