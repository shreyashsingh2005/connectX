const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// The main max-w wrapper should handle ALL padding centrally.
code = code.replace(/<div className="w-full max-w-\[680px\] flex flex-col min-h-full">/g, '<div className="w-full max-w-[680px] flex flex-col min-h-full px-4 md:px-6">');

// Remove all redundant px-4 md:px-0 from the section wrappers
code = code.replace(/px-4 md:px-0 py-6/g, 'py-6');
code = code.replace(/px-4 md:px-0 mt-8/g, 'mt-8');
code = code.replace(/px-4 md:px-0 mt-6/g, 'mt-6');
code = code.replace(/px-4 md:px-0/g, ''); // catch any other section wrappers

// Remove all redundant mx-4 md:mx-0 from the cards
code = code.replace(/mx-4 md:mx-0/g, 'w-full');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Centralized spacing applied");
