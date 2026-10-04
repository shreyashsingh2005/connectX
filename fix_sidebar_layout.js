const fs = require('fs');

let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// Replace the aside class string with a much cleaner set of classes strictly tailored for the grid
const oldClassRegex = /className=\{cn\("md:flex flex-row md:flex-col items-center[^"]+", hideOnMobile \? "translate-y-full md:translate-y-0 hidden md:flex" : "translate-y-0 flex"\)\}/g;
const newClass = `className={cn(
        "flex-shrink-0 z-[100] transition-transform duration-150",
        // Desktop: static flex child of the grid column
        "md:relative md:w-full md:h-full md:flex md:flex-col md:items-center md:py-6 md:bg-bg-surface md:border-r md:border-border-subtle md:rounded-none md:shadow-none md:translate-y-0",
        // Mobile: fixed bottom nav
        "fixed bottom-[12px] left-[12px] right-[12px] h-[58px] flex flex-row items-center justify-between px-4 rounded-[20px] bg-bg-surface/90 dark:bg-[rgba(20,25,30,0.82)] backdrop-blur-[18px] border border-border-subtle shadow-lg",
        hideOnMobile ? "translate-y-[150%] hidden md:flex" : "translate-y-0 flex"
      )}`;

if(code.match(oldClassRegex)) {
  code = code.replace(oldClassRegex, newClass);
  fs.writeFileSync('src/components/layout/AppSidebar.tsx', code);
  console.log("AppSidebar.tsx classes replaced successfully.");
} else {
  console.log("Regex didn't match AppSidebar.tsx");
}
