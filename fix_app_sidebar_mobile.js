const fs = require('fs');

let sidebar = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// Replace mobile styles for AppSidebar
sidebar = sidebar.replace(
  /"fixed bottom-\[calc\(12px\+env\(safe-area-inset-bottom\)\)\] left-\[12px\] right-\[12px\] h-\[58px\] flex flex-row items-center justify-between px-4 rounded-\[20px\] bg-bg-surface\/90 dark:bg-\[rgba\(20,25,30,0\.82\)\] backdrop-blur-\[18px\] border border-border-subtle shadow-lg",/g,
  `"fixed bottom-0 left-0 right-0 h-[calc(58px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] flex flex-row items-center justify-between px-6 bg-bg-surface/90 dark:bg-[rgba(20,25,30,0.82)] backdrop-blur-[18px] border-t border-border-subtle shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-none z-[100]",`
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', sidebar);
console.log('Fixed AppSidebar bottom mobile positioning');
