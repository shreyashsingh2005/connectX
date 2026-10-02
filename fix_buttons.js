const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

code = code.replace(
  '<button onClick={() => setReplyToMessage(null)}',
  '<button type="button" onClick={() => setReplyToMessage(null)}'
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log('Fixed button type');
