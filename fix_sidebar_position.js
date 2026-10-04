const fs = require('fs');

let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

code = code.replace(
  /"md:relative md:w-full md:h-full md:flex md:flex-col md:items-center md:py-6 md:bg-bg-surface md:border-r md:border-border-subtle md:rounded-none md:shadow-none md:translate-y-0",/g,
  '"md:static md:w-full md:h-full md:flex md:flex-col md:items-center md:py-6 md:bg-bg-surface md:border-r md:border-border-subtle md:rounded-none md:shadow-none md:translate-y-0 md:inset-auto",'
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code);
console.log("AppSidebar.tsx updated with static and inset-auto");
