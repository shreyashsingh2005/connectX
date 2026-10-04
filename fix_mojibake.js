const fs = require('fs');
let content = fs.readFileSync('src/components/modals/UsernameSetupModal.tsx', 'utf8');
content = content.replace(/o" /g, '✓ ');
content = content.replace(/o  /g, '✕ ');
fs.writeFileSync('src/components/modals/UsernameSetupModal.tsx', content);
