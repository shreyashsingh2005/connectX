const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');
content = content.replace("VideoOff\n  Pin,", "VideoOff,\n  Pin,");
content = content.replace("VideoOff\r\n  Pin,", "VideoOff,\r\n  Pin,");
fs.writeFileSync('src/components/chat/MessageBubble.tsx', content);
