const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Remove rounding from grouped row items so hover effects fill the row perfectly
code = code.replace(/hover:bg-bg-secondary rounded-\[12px\]/g, 'hover:bg-bg-secondary');

// Ensure row spacing is flush (remove custom my-1 inside list containers if any)
code = code.replace(/<div className="h-\[1px\] bg-\[#EAECF0\] dark:bg-\[rgba\(255,255,255,0\.08\)\] w-\[calc\(100%-24px\)\] mx-auto my-1" \/>/g, '<div className="h-[1px] bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] w-[calc(100%-32px)] mx-auto" />');

// Make section titles more exact to spec: 11px, 600, uppercase, letter-spacing: 0.06em
code = code.replace(/text-\[11px\] font-\[600\] text-text-sec uppercase tracking-\[0\.06em\] mb-1\.5 px-4 md:px-2/g, 'text-[11px] font-[600] text-text-sec uppercase tracking-[0.06em] mb-1.5 px-6 md:px-2');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Cleaned up grouped list rows");
