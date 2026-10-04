const fs = require('fs');

let layoutCode = fs.readFileSync('src/app/(app)/layout.tsx', 'utf8');
layoutCode = layoutCode.replace(
  /<AppSidebar \/>/g,
  '<div className="hidden md:block col-start-1 col-end-2 w-full h-[100dvh]"><AppSidebar /></div>'
);

layoutCode = layoutCode.replace(
  /<div className="hidden md:flex flex-col h-\[100dvh\] overflow-hidden min-w-0 border-r border-border-subtle bg-bg-surface">/g,
  '<div className="hidden md:flex flex-col h-[100dvh] overflow-hidden min-w-0 border-r border-border-subtle bg-bg-surface col-start-2 col-end-3">'
);

layoutCode = layoutCode.replace(
  /<main key=\{pathname\} className=\{cn\(/g,
  '<main key={pathname} className={cn(\n        "md:col-start-3 md:col-end-4",'
);

fs.writeFileSync('src/app/(app)/layout.tsx', layoutCode);
console.log("Updated layout.tsx to explicitly use grid columns.");
