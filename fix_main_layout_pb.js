const fs = require('fs');
let layout = fs.readFileSync('src/app/(app)/layout.tsx', 'utf8');

layout = layout.replace(
  /pb-\[calc\(70px\+env\(safe-area-inset-bottom\)\)\]/g,
  'pb-[calc(58px+env(safe-area-inset-bottom))]'
);

fs.writeFileSync('src/app/(app)/layout.tsx', layout);
console.log('Fixed main layout padding');
