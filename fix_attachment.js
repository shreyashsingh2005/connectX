const fs = require('fs');
let code = fs.readFileSync('src/components/chat/EncryptedAttachment.tsx', 'utf8');

code = code.replace(
  /Failed to load encrypted file/,
  "Unable to decrypt attachment"
);

fs.writeFileSync('src/components/chat/EncryptedAttachment.tsx', code, 'utf8');
console.log("Updated EncryptedAttachment");
