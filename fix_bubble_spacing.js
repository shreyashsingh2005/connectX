const fs = require('fs');

let bubble = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// "message group: 6-10px"
bubble = bubble.replace(/showAvatar \? 'mt-4 mb-0\.5' : 'mb-\[2px\]'/g, "showAvatar ? 'mt-[10px] mb-[4px]' : 'mb-[4px]'");

fs.writeFileSync('src/components/chat/MessageBubble.tsx', bubble);
console.log("Updated MessageBubble grouping spacing");
