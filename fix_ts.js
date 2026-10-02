const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');

code = code.replace(
  /<ChatHeader conversation=\{conversation\} \/>/g,
  '<ChatHeader conversation={conversation!} />'
);

code = code.replace(
  /<ProfilePanel conversation=\{conversation\} \/>/g,
  '<ProfilePanel conversation={conversation!} />'
);

fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', code, 'utf8');
console.log('Fixed TypeScript null errors');
