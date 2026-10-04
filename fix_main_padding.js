const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/layout.tsx', 'utf8');
code = code.replace(
  /<main key=\{pathname\} className="flex-1 flex flex-col min-w-0 min-h-0 h-\[100dvh\] overflow-hidden relative">/g,
  '<main key={pathname} className={cn("flex flex-col min-w-0 min-h-0 h-[100dvh] overflow-hidden relative", hideOnMobile ? "pb-0" : "pb-[80px] md:pb-0")}>'
);

// We need to add `cn` back if we use it, and `hideOnMobile`.
// Oh wait, `hideOnMobile` is not defined in the new layout?
// Let's check if it is.
