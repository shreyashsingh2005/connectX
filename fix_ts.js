const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');
content = content.replace(/const duration = useChatStore\.getState\(\)\.recordingDuration \|\| 1; \/\/ Or fallback/g, '');
fs.writeFileSync('src/components/chat/MessageComposer.tsx', content);
