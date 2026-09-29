const fs = require('fs');
let file = fs.readFileSync('src/components/chat/EncryptedAttachment.tsx', 'utf8');

file = file.replace(
  `<Loader2 className="w-4 h-4 animate-spin" /> Decrypting...`,
  `<div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />`
);

fs.writeFileSync('src/components/chat/EncryptedAttachment.tsx', file);
