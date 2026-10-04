const fs = require('fs');

let settings = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

settings = settings.replace(
  /flex-1 flex items-center justify-center gap-2 h-\[40px\]/g,
  'flex-1 flex items-center justify-center gap-1.5 md:gap-2 h-[40px]'
);

fs.writeFileSync('src/app/(app)/settings/page.tsx', settings);
console.log('Fixed settings theme toggle gap');
