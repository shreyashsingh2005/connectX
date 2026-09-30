const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

file = file.replace(
  /const uploadAttachment = async \(att: AttachmentPreviewType, messageId: string\): Promise<string \| null> => \{/g,
  `const uploadAttachment = async (att: AttachmentPreviewType, messageId: string): Promise<{url: string, path: string} | null> => {`
);

file = file.replace(
  /return publicUrl;\n\s*\};/g,
  `return { url: publicUrl, path };\n    };`
);

file = file.replace(
  /const url = await uploadAttachment\(att, newMessage\.id\);\n\s*if \(url\) \{/g,
  `const uploadRes = await uploadAttachment(att, newMessage.id);\n          if (uploadRes) {\n            const { url, path } = uploadRes;`
);

file = file.replace(
  /storage_path: \`\$\{profile\.id\}\/\$\{newMessage\.id\}\/\$\{att\.id\}\`,/g,
  `storage_path: path,`
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
console.log("Fixed storage_path");
