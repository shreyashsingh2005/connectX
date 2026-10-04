const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Container width
code = code.replace(/max-w-\[600px\]/g, 'max-w-[680px]');

// Profile Row Header
code = code.replace(
  /<div className="flex items-center gap-4 bg-bg-surface rounded-\[16px\] border border-border-subtle shadow-sm dark:shadow-none p-4 mb-6 cursor-pointer hover:bg-bg-secondary transition-colors" onClick=\{\(\) => setActiveSection\("account"\)\}>/g,
  '<div className="flex items-center gap-4 bg-bg-surface rounded-[10px] border border-border-subtle h-[68px] px-4 mb-6 cursor-pointer hover:bg-bg-secondary transition-colors" onClick={() => setActiveSection("account")}>'
);
code = code.replace(/className="w-\[60px\] h-\[60px\]"/g, 'className="w-[48px] h-[48px]"');
code = code.replace(/text-\[17px\] font-\[600\]/g, 'text-[15px] font-[600]');
code = code.replace(/ChevronRight size=\{18\}/g, 'ChevronRight size={16}');

// Section Titles
code = code.replace(/text-\[11px\] font-\[600\] text-text-sec uppercase tracking-wider mb-1\.5 px-4 md:px-1/g, 'text-[11px] font-[600] text-text-sec uppercase tracking-[0.06em] mb-1.5 px-4 md:px-2');

// Grouped List Containers
code = code.replace(/bg-bg-surface rounded-\[16px\] border border-border-subtle shadow-sm dark:shadow-none overflow-hidden/g, 'bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden mx-4 md:mx-0');
// Remove duplicates from previous passes
code = code.replace(/bg-transparent border-t border-b md:border md:rounded-\[14px\] border-border-subtle overflow-hidden my-4 md:my-6/g, 'bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden mx-4 md:mx-0 my-6');
code = code.replace(/bg-bg-surface border-y md:border md:rounded-\[14px\] border-border-subtle overflow-hidden my-4 md:my-6/g, 'bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden mx-4 md:mx-0 my-6');
code = code.replace(/bg-bg-surface rounded-\[24px\] border border-transparent border-border-subtle md:border-border-subtle shadow-sm overflow-hidden mt-2 mx-4 md:mx-0 mb-4/g, 'bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden mx-4 md:mx-0 mb-6');
code = code.replace(/bg-bg-surface rounded-\[24px\] border border-transparent border-border-subtle md:border-border-subtle shadow-sm overflow-hidden mt-2 mx-4 md:mx-0/g, 'bg-bg-surface rounded-[10px] border border-border-subtle overflow-hidden mx-4 md:mx-0 mb-6');

// Row Heights
code = code.replace(/flex items-center justify-between flex items-center justify-between w-full px-4 h-\[52px\] hover:bg-bg-secondary transition-colors outline-none group/g, 'flex items-center justify-between w-full px-4 h-[52px] hover:bg-bg-secondary transition-colors outline-none group');
code = code.replace(/text-\[14px\] font-\[500\] text-text-main/g, 'text-[14px] font-[600] text-text-main');

// Appearance Segmented Control
code = code.replace(/h-\[42px\]/g, 'h-[40px]');
code = code.replace(/rounded-\[12px\] p-1/g, 'rounded-[12px] p-1');
code = code.replace(/text-\[13px\] font-medium/g, 'text-[12px] font-medium');
// Active segmented control class
code = code.replace(
  /'bg-brand\/10 text-brand shadow-sm border border-transparent'/g,
  "'bg-brand/10 text-brand rounded-[10px] shadow-none border-none'"
);

// Account Profile Photo Size
code = code.replace(/w-\[64px\] h-\[64px\]/g, 'w-[72px] h-[72px]');
code = code.replace(/<div className="absolute inset-0 bg-bg-primary\/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">/g, '<div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">');
code = code.replace(/<Camera size=\{18\} strokeWidth=\{1\.75\} className="text-white" \/>/g, '<Camera size={20} strokeWidth={2} className="text-white" />');
// Remove giant button "Change photo"
code = code.replace(/<button type="button" onClick=\{\(\) => setShowPhotoEditor\(true\)\} className="h-\[34px\] px-3 bg-bg-surface dark:bg-\[rgba\(255,255,255,0\.04\)\] border border-border-subtle text-text-main hover:bg-bg-secondary transition-colors rounded-\[8px\] text-\[13px\] font-medium shadow-sm mb-1\.5 outline-none">\s*Change photo\s*<\/button>/g, '');

// Clean any 600px wrapper
code = code.replace(/max-w-\[600px\]/g, 'max-w-[680px]');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Applied Settings structural redesign");
