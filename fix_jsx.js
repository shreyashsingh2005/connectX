const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

code = code.replace(
  /<\/div>\s*<\/div>\s*\);\s*\}/,
  '</div>\n    </form>\n  );\n}'
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log('Fixed JSX tag');
