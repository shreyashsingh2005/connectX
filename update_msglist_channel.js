const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

file = file.replace(
  /\.channel\(`messages:\$\{conversationId\}:\$\{Math\.random\(\)\.toString\(36\)\.substring\(7\)\}`\)/,
  `.channel(\`room:\${conversationId}\`)`
);

fs.writeFileSync('src/components/chat/MessageList.tsx', file);
