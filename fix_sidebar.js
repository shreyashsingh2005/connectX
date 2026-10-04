const fs = require('fs');

let sidebar = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// Import Radix tooltips
if (!sidebar.includes('TooltipProvider')) {
  sidebar = sidebar.replace(
    "import { ConnectXLogo } from '@/components/ui/ConnectXLogo';",
    "import { ConnectXLogo } from '@/components/ui/ConnectXLogo';\nimport { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';"
  );
}

// Replace the <Link ...> with Tooltip wrapped Link
const linkRegex = /<Link\s+key=\{href\}[\s\S]*?<\/Link>/g;
sidebar = sidebar.replace(linkRegex, (match) => {
  // Extract the buggy tooltip
  const withoutTooltip = match.replace(/\{\/\* Tooltip \*\/\}\s*<span className="hidden md:block absolute left-full ml-3.*?<\/span>/, '');
  
  return `<TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  ${withoutTooltip}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="hidden md:block">
                  {label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>`;
});

fs.writeFileSync('src/components/layout/AppSidebar.tsx', sidebar);
console.log('Updated AppSidebar to use Radix Tooltips');
