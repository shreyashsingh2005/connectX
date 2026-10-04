const fs = require('fs');
let sidebar = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

sidebar = sidebar.replace(/<span className="hidden md:block absolute left-full[\s\S]*?<\/span>/g, '');
sidebar = sidebar.replace(/<TooltipProvider delayDuration=\{150\}>\s*<Tooltip>\s*<TooltipTrigger asChild>\s*<Link\s*key=\{href\}/g, 
'<TooltipProvider key={href} delayDuration={150}>\n              <Tooltip>\n                <TooltipTrigger asChild>\n                  <Link');

// Bottom Settings and Logout buttons need Tooltip wrapping too.
// I'll replace the entire bottom div.
const oldBottomDiv = /<div className="hidden md:flex flex-col items-center gap-2 md:mb-2">[\s\S]*?<\/aside>/;
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

        {/* Profile avatar (Desktop) */}
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

sidebar = sidebar.replace(oldBottomDiv, newBottomDiv);

// Also safe-area for AppSidebar bottom
sidebar = sidebar.replace(/bottom-\[12px\]/, 'bottom-[calc(12px+env(safe-area-inset-bottom))]');

fs.writeFileSync('src/components/layout/AppSidebar.tsx', sidebar);
console.log('Fixed AppSidebar fully');
