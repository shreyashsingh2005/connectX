const fs = require('fs');

let layoutCode = fs.readFileSync('src/app/(app)/layout.tsx', 'utf8');
// Remove the hidden md:block wrapper and just add the classes to AppSidebar or render it normally but with a wrapper that doesn't hide it, OR pass a prop.
// Better: just render the wrapper for grid cell on desktop, and AppSidebar handles its own fixed placement on mobile. But if the wrapper is in the DOM on mobile, it shouldn't take up space.
// If it's a grid cell wrapper, on mobile it's just a block element.
layoutCode = layoutCode.replace(
  /<div className="hidden md:block col-start-1 col-end-2 w-full h-\[100dvh\]"><AppSidebar \/><\/div>/g,
  '<div className="md:col-start-1 md:col-end-2 w-full md:h-[100dvh]"><AppSidebar /></div>'
);

fs.writeFileSync('src/app/(app)/layout.tsx', layoutCode);
console.log("Fixed AppSidebar wrapper");
