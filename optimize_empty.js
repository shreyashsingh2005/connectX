const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');

// Compact empty state padding
code = code.replace(/py-12/g, 'py-8');

// Faster motion
code = code.replace(/duration-200/g, 'duration-150');

// "Suggested for you" section header to 13px / 600
code = code.replace(/<h2 className="text-\[13px\] font-\[600\] text-text-main mt-\[16px\] mb-\[8px\] px-1">/g, '<h2 className="text-[13px] font-[600] text-text-main mt-4 mb-2 px-1">');
code = code.replace(/<h2 className="text-\[13px\] font-\[600\] text-text-main mt-\[16px\] mb-\[8px\] px-1 flex items-center gap-2">/g, '<h2 className="text-[13px] font-[600] text-text-main mt-4 mb-2 px-1 flex items-center gap-2">');

fs.writeFileSync('src/app/(app)/contacts/page.tsx', code);
console.log("Empty states and spacing optimized");
