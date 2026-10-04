const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Replace all remaining variations of big cards with standard grouped list containers
code = code.replace(/bg-bg-surface rounded-\[16px\] border border-transparent border-border-subtle md:border-border-subtle shadow-sm overflow-hidden mx-4 md:mx-0/g, 'bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden mx-4 md:mx-0');
code = code.replace(/bg-bg-surface rounded-\[16px\] border border-transparent border-border-subtle md:border-border-subtle shadow-sm overflow-hidden mx-4 md:mx-0 mb-6/g, 'bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden mx-4 md:mx-0 mb-6');
code = code.replace(/bg-bg-surface rounded-\[16px\] border border-transparent border-border-subtle md:border-border-subtle shadow-sm overflow-hidden mx-4 md:mx-0 mb-6 p-2/g, 'bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden mx-4 md:mx-0 mb-6 p-1.5');
code = code.replace(/bg-bg-surface rounded-\[24px\] border border-transparent border-border-subtle md:border-border-subtle shadow-sm overflow-hidden mt-2 mx-4 md:mx-0 p-6/g, 'bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden mt-2 mx-4 md:mx-0 p-6');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Applied final rounding fixes");
