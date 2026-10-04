const fs = require('fs');
let layout = fs.readFileSync('src/app/(app)/layout.tsx', 'utf8');

layout = layout.replace(
  /md:grid-cols-\[72px_340px_minmax\(0,1fr\)\]/,
  'md:grid-cols-[72px_320px_minmax(0,1fr)] lg:grid-cols-[72px_340px_minmax(0,1fr)]'
);

// Also fix mobile padding to use env(safe-area-inset-bottom) for the AppSidebar if possible, though bottom-[12px] is used in AppSidebar.
// The main content uses pb-[80px]. Let's make it more robust for safe areas.
layout = layout.replace(
  /pb-\[80px\] md:pb-0/,
  'pb-[calc(70px+env(safe-area-inset-bottom))] md:pb-0'
);

fs.writeFileSync('src/app/(app)/layout.tsx', layout);
console.log('Updated app layout.tsx grid and safe areas');
