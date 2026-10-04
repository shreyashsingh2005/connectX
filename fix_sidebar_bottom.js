const fs = require('fs');

let sidebar = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// Replace Settings tooltip span
sidebar = sidebar.replace(
  /<span className="hidden md:block absolute left-full ml-3 top-1\/2 -translate-y-1\/2 bg-\[#17151F\].*?>\s*Settings\s*<\/span>/gs,
  ''
);
// Replace Logout tooltip span
sidebar = sidebar.replace(
  /<span className="hidden md:block absolute left-full ml-3 top-1\/2 -translate-y-1\/2 bg-\[#17151F\].*?>\s*Logout\s*<\/span>/gs,
  ''
);

// We need to wrap Settings and Logout links with TooltipProvider
const wrapWithTooltip = (html, label) => {
  return `<TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                ${html}
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="hidden md:block">
                ${label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>`;
};

// This is complex using regex, I'll just write a script to replace them exactly.
// It's easier to just provide the exact replacement for the whole bottom div.
let bottomDivRegex = /<div className="hidden md:flex flex-col items-center gap-2 md:mb-2">[\s\S]*?<\/div>\s*<\/aside>/;
const newBottomDiv = `<div className="hidden md:flex flex-col items-center gap-2 md:mb-2">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                aria-label="Settings"
                className={cn(
                  'relative group w-[42px] h-[42px] rounded-[12px] flex items-center justify-center transition-all duration-150',
                  pathname.startsWith('/settings')
                    ? 'text-brand bg-brand-soft'
                    : 'text-text-sec hover:text-text-main dark:hover:text-text-main hover:bg-[#F1F3F5] dark:hover:bg-[rgba(255,255,255,0.06)]'
                )}
              >
                <Settings size={18} strokeWidth={2} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="hidden md:block">
              Settings
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="relative group w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-text-sec hover:text-text-main dark:hover:text-text-main hover:bg-[#F1F3F5] dark:hover:bg-[rgba(255,255,255,0.06)] transition-all duration-150"
              >
                <LogOut size={18} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="hidden md:block">
              Logout
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Link
          href="/settings"
          aria-label="Settings"
          className="mt-2 relative group transition-opacity duration-150 hover:opacity-80"
        >
          <UserAvatar
            src={profile?.avatar_url}
            name={profile?.display_name || 'User'}
            size="sm"
            className="rounded-full"
          />
        </Link>
      </div>
    </aside>`;

sidebar = sidebar.replace(bottomDivRegex, newBottomDiv);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', sidebar);
console.log('Fixed bottom tooltips in AppSidebar');
