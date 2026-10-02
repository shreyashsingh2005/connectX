const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

code = code.replace(
  '<button\n                onClick={() => removeAttachment(att.id)}',
  '<button type="button"\n                onClick={() => removeAttachment(att.id)}'
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log('Fixed removeAttachment button type');
