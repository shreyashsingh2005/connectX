const fs = require('fs');
let sidebar = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

sidebar = sidebar.replace(
  /bottom-\[12px\]/,
  'bottom-[calc(12px+env(safe-area-inset-bottom))]'
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', sidebar);
console.log('Updated AppSidebar bottom safe area');
