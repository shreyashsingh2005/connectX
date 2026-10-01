const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

if (!code.includes('Bell,')) {
  code = code.replace(/Search,/g, "Search, Bell,");
}
if (!code.includes('notifications')) {
  code = code.replace(
    /\{ href: '\/search', icon: Search, label: 'Search' \},/,
    "{ href: '/search', icon: Search, label: 'Search' },\n  { href: '/notifications', icon: Bell, label: 'Notifications' },"
  );
}

code = code.replace(/bg-white\/80 dark:bg-\[#0E1015\]\/80 backdrop-blur-xl border-t md:border-t-0 md:border-r border-gray-200\/50 dark:border-\[#252A34\]/g, "bg-[#FFFFFF] dark:bg-[#090B10] border-t md:border-t-0 md:border-r border-[#EAECF0] dark:border-[#252A34]");

code = code.replace(/duration-300/g, "duration-150");

// Active state
code = code.replace(
  /'bg-\[#A855F7\]\/15 text-\[#8B5CF6\] dark:text-\[#A78BFA\] '/,
  "'bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#A78BFA] relative before:absolute before:left-[0px] before:top-[25%] before:h-[50%] before:w-[3px] before:bg-[#8B5CF6] before:rounded-r-md '"
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code, 'utf8');
console.log("Updated App Nav");
