const fs = require('fs');

let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// Remove native title attributes to prevent duplicate tooltips
code = code.replace(/title=\{label\}/g, '');
code = code.replace(/title="Settings"/g, '');
code = code.replace(/title="Logout"/g, '');

// Ensure custom tooltips have robust rendering (min-w-max so it doesn't wrap into a vertical line)
code = code.replace(
  /className="hidden md:block absolute left-full ml-3 top-1\/2 -translate-y-1\/2 bg-text-main text-bg-surface text-\[11px\] font-medium rounded-md px-2\.5 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-sm translate-x-\[-4px\] group-hover:translate-x-0"/g,
  'className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#17151F] dark:bg-white text-white dark:text-[#17151F] text-[12px] font-medium rounded-[6px] px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[9999] shadow-sm translate-x-[-4px] group-hover:translate-x-0 min-w-max border border-transparent dark:border-border-subtle"'
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code);
console.log("AppSidebar tooltips fixed");
