const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');
content = content.replace("URL.createObjectURL(audioFile),\\n          type: 'audio'", "URL.createObjectURL(audioFile),\n          type: 'audio'");
fs.writeFileSync('src/components/chat/MessageComposer.tsx', content);
