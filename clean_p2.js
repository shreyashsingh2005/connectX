const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Remove redundant p-2 from list groups
code = code.replace(/<div className="flex flex-col p-2">/g, '<div className="flex flex-col">');

// Ensure section titles have correct spec and mt-4 to space out from previous lists
code = code.replace(/<h3 className="text-\[11px\] font-\[600\] text-text-sec uppercase tracking-\[0\.06em\] mb-1\.5 px-6 md:px-2 mx-4 md:mx-0">/g, '<h3 className="text-[11px] font-[600] text-text-sec uppercase tracking-[0.06em] mb-1.5 px-6 md:px-2 w-full mt-6">');
code = code.replace(/<h3 className="text-\[11px\] font-\[600\] text-text-sec uppercase tracking-\[0\.06em\] mb-1\.5 px-6 md:px-2 w-full mt-2">/g, '<h3 className="text-[11px] font-[600] text-text-sec uppercase tracking-[0.06em] mb-1.5 px-6 md:px-2 w-full mt-6">');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Removed p-2 from grouped lists");
