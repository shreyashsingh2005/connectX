const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/layout.tsx', 'utf8');

code = code.replace(
  /<div className="md:col-start-1 md:col-end-2 w-full md:h-\[100dvh\] min-w-0 min-h-0 relative">/g,
  '<div className="md:col-start-1 md:col-end-2 w-full md:h-[100dvh] min-w-0 min-h-0 relative z-[50]">'
);

fs.writeFileSync('src/app/(app)/layout.tsx', code);
console.log("layout.tsx updated with z-[50] for nav column");
