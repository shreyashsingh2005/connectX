const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Theme wrapper fixes
code = code.replace(/bg-\[#F6F7F9\] dark:bg-bg-primary/g, 'bg-bg-primary');
code = code.replace(/bg-\[#FFFFFF\] dark:bg-bg-surface/g, 'bg-bg-surface');
code = code.replace(/bg-\[#FFFFFF\] dark:bg-bg-primary/g, 'bg-bg-surface');
code = code.replace(/bg-\[#FFFFFF\]/g, 'bg-bg-surface');

// Main view layout updates
// Remove huge cards formatting and use native list styling
code = code.replace(/rounded-\[16px\] border border-border-subtle shadow-sm dark:shadow-none overflow-hidden mx-4 md:mx-0 mb-6 p-2/g, 'bg-transparent border-t border-b md:border md:rounded-[14px] border-border-subtle overflow-hidden my-4 md:my-6');
code = code.replace(/rounded-\[16px\] border border-border-subtle shadow-sm dark:shadow-none overflow-hidden mx-4 md:mx-0 mb-6/g, 'bg-bg-surface border-y md:border md:rounded-[14px] border-border-subtle overflow-hidden my-4 md:my-6');
code = code.replace(/rounded-\[16px\] border border-border-subtle shadow-sm dark:shadow-none overflow-hidden mx-4 md:mx-0/g, 'bg-bg-surface border-y md:border md:rounded-[14px] border-border-subtle overflow-hidden my-4 md:my-6');

// Row Heights and Spacing
code = code.replace(/h-\[54px\] hover:bg-bg-secondary/g, 'h-[52px] hover:bg-bg-secondary');
code = code.replace(/p-3 hover:bg-bg-secondary/g, 'px-4 h-[52px] hover:bg-bg-secondary');
code = code.replace(/w-full px-4 h-\[52px\] hover:bg-bg-secondary/g, 'flex items-center justify-between w-full px-4 h-[52px] hover:bg-bg-secondary');

// Text sizing
code = code.replace(/text-\[14px\] font-medium text-text-main/g, 'text-[14px] font-[500] text-text-main');
code = code.replace(/text-\[12px\] font-semibold text-text-sec uppercase tracking-wider mb-2 px-1/g, 'text-[11px] font-[600] text-text-sec uppercase tracking-wider mb-1.5 px-4 md:px-1');
code = code.replace(/ChevronRight size=\{16\}/g, 'ChevronRight size={15}');

// Segmented Control for Theme
code = code.replace(/h-\[44px\]/g, 'h-[42px]');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Settings Refactored");
