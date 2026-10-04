const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');

code = code.replace(
  /<p className="text-\[12px\] text-\[\#667085\] dark:text-\[\#A7AFB8\]">Use the search bar above to find people\.<\/p>/,
  '<p className="text-[12px] text-[#667085] dark:text-[#A7AFB8]">When someone sends you a friend request, it will appear here.</p>'
);

fs.writeFileSync('src/app/(app)/contacts/page.tsx', code);
console.log('Empty state text fixed');
