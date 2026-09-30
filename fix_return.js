const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

file = file.replace(
  /return publicUrl;/g,
  `return { url: publicUrl, path };`
);

// We should also check if the destructured path was applied properly
if (!file.includes("const { url, path } = uploadRes;")) {
  file = file.replace(
    /const url = await uploadAttachment\(att, newMessage\.id\);\n\s*if \(url\) \{/,
    `const uploadRes = await uploadAttachment(att, newMessage.id);\n          if (uploadRes) {\n            const { url, path } = uploadRes;`
  );
}

fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
console.log("Fixed return type");
