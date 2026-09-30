const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

file = file.replace(
  "const url = await uploadAttachment(att, newMessage.id);",
  "const uploadRes = await uploadAttachment(att, newMessage.id);"
);

file = file.replace(
  "if (url) {",
  "if (uploadRes) {\n            const { url, path } = uploadRes;"
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
console.log("Replaced using string");
