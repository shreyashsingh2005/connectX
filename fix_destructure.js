const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

file = file.replace(
  /const url = await uploadAttachment\(att, newMessage\.id\);\n\s*if \(url\) \{/g,
  `const uploadRes = await uploadAttachment(att, newMessage.id);\n          if (uploadRes) {\n            const { url, path } = uploadRes;`
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
console.log("Fixed upload url destructuring");
