const fs = require('fs');

let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// Use brand color and soft brand bg for active item
code = code.replace(
  /'text-text-main bg-\[\#F1F3F5\] dark:bg-\[\#1A1F2B\]'/g,
  "'text-brand bg-brand-soft'"
);

// Fix tooltip colors
code = code.replace(
  /bg-gray-900 dark:bg-\[\#F5F7FA\] text-white dark:text-text-main/g,
  'bg-text-main text-bg-surface'
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code);
console.log('AppSidebar active state updated');
