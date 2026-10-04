const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/notifications/page.tsx', 'utf8');

// Row
code = code.replace(/p-3 h-auto min-h-\[64px\] rounded-\[14px\]/g, 'px-[14px] py-[12px] h-auto min-h-[60px] rounded-[14px]');

// Avatar
code = code.replace(/w-\[36px\] h-\[36px\]/g, 'w-[40px] h-[40px]');
code = code.replace(/size="sm"/g, 'size="md"');

// Title/Text
code = code.replace(/text-\[14px\] font-\[600\] text-text-main leading-tight mb-0\.5/g, 'text-[13px] md:text-[14px] font-[600] text-text-main leading-tight mb-0.5');
code = code.replace(/text-\[13px\] text-text-sec leading-snug/g, 'text-[13px] text-text-sec leading-snug');

// Timestamp
code = code.replace(/text-\[11px\] text-text-muted mt-1\.5 block/g, 'text-[10px] md:text-[11px] text-text-muted mt-1 block font-medium');

// Dismiss icon
code = code.replace(/<X size=\{18\}/g, '<X size={16}');

// Action Buttons
code = code.replace(/px-3 py-1\.5 bg-brand text-white rounded-\[8px\] text-\[12px\] font-medium/g, 'px-[12px] h-[32px] bg-brand text-white rounded-[8px] text-[12px] font-[600]');
code = code.replace(/px-3 py-1\.5 bg-bg-primary text-text-sec border border-border-subtle rounded-\[8px\] text-\[12px\] font-medium/g, 'px-[12px] h-[32px] bg-bg-secondary text-text-sec border border-border-subtle rounded-[8px] text-[12px] font-[600]');

// Clean up any duplicated borders
code = code.replace(/border-border-subtle border-border-subtle/g, 'border-border-subtle');

fs.writeFileSync('src/app/(app)/notifications/page.tsx', code);
console.log("Notifications fixed");
