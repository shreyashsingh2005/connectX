const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');

// Ensure MoreHorizontal is imported from lucide-react
if (!code.includes('MoreHorizontal')) {
  code = code.replace(/import {([^}]+)} from 'lucide-react';/, (match, p1) => {
    return `import {${p1}, MoreHorizontal } from 'lucide-react';`;
  });
}

// Add the More button to the friend context
code = code.replace(
  /Message\n\s*<\/button>\n\s*\)}/g,
  `Message\n            </button>\n            <button className="flex items-center justify-center w-[32px] h-[32px] bg-transparent hover:bg-bg-secondary text-text-sec rounded-[8px] transition-colors">\n              <MoreHorizontal size={16} strokeWidth={1.75} />\n            </button>\n          )}`
);

fs.writeFileSync('src/app/(app)/contacts/page.tsx', code);
console.log("Added More button to Friends row");
