const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/layout.tsx', 'utf8');

code = code.replace(
  /bg-white dark:bg-\[#0B0F19\]/g,
  "bg-[#F8FAFC] dark:bg-[#0B0D12]"
);

fs.writeFileSync('src/app/(app)/layout.tsx', code, 'utf8');
console.log("Updated App Layout");
