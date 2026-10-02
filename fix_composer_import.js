const fs = require('fs');

let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// The lucide-react import list might contain Paperclip but not Plus.
// We can just add Plus to the import list safely using a regex.
code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, group1) => {
  if (!group1.includes('Plus')) {
    return `import {${group1}, Plus} from 'lucide-react';`;
  }
  return match;
});

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log("Added Plus import");
