const fs = require('fs');

let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

code = code.replace(
  /md:py-6/g,
  'md:pt-5 md:pb-6'
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code);
console.log("AppSidebar.tsx top padding aligned with Chats sidebar");
