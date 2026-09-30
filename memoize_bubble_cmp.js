const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// The script above added `});` but we can replace it with our custom comparator
file = file.replace(
  /\}\);\n\n\/\/ Custom comparison function.*/,
  `}, (prev, next) => {
  return (
    prev.message === next.message &&
    prev.isOwn === next.isOwn &&
    prev.showAvatar === next.showAvatar &&
    prev.showSender === next.showSender &&
    prev.currentUserId === next.currentUserId
  );
});`
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', file);
console.log("Added custom comparator to MessageBubble memo");
