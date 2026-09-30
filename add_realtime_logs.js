const fs = require('fs');
let file = fs.readFileSync('src/hooks/useConversations.tsx', 'utf8');

file = file.replace(
  /async \(payload\) => \{\n\s*const newMsgRaw = payload\.new as Message;/,
  `async (payload) => {\n            console.log("[Realtime] platform=desktop/mobile", "subscriptionStatus=SUBSCRIBED", "eventType=INSERT", "messageId=" + payload.new.id, "received=true");\n            const newMsgRaw = payload.new as Message;`
);

fs.writeFileSync('src/hooks/useConversations.tsx', file);
console.log("Added realtime logs");
