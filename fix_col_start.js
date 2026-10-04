const fs = require('fs');

let layoutCode = fs.readFileSync('src/app/(app)/layout.tsx', 'utf8');
layoutCode = layoutCode.replace(
  /col-start-2 col-end-3/g,
  'md:col-start-2 md:col-end-3'
);
fs.writeFileSync('src/app/(app)/layout.tsx', layoutCode);
console.log("Fixed col-start in layout.tsx");
