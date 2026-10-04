const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');

// Row padding for 60-64px
// Currently it's `py-[10px]`. With 40px avatar it's 60px.
code = code.replace(/py-\[10px\]/g, 'py-[12px]');

// Avatar
code = code.replace(/className="w-\[36px\] h-\[36px\] text-\[13px\]"/g, 'className="w-[40px] h-[40px] text-[13px]"');

// Name & Username
code = code.replace(/text-\[13px\] truncate leading-\[18px\]/g, 'text-[14px] truncate leading-[18px]');
code = code.replace(/text-\[11px\] text-text-sec truncate leading-\[16px\]/g, 'text-[12px] text-text-sec truncate leading-[16px]');

// Buttons to 32px height
code = code.replace(/h-\[30px\]/g, 'h-[32px]');
code = code.replace(/px-\[11px\]/g, 'px-[12px]');
code = code.replace(/px-3/g, 'px-[12px]');
code = code.replace(/text-\[12px\] font-medium/g, 'text-[12px] font-[600]');

// Add spacing between items
code = code.replace(/last:border-b-0 hover:bg-bg-secondary/g, 'last:border-b-0 hover:bg-bg-secondary');

// Segmented Control (Requests / Friends) height 38px
code = code.replace(/h-\[40px\] mb-\[16px\]/g, 'h-[38px] mb-[16px]');
code = code.replace(/h-\[34px\] text-\[13px\]/g, 'h-[32px] text-[13px]');

fs.writeFileSync('src/app/(app)/contacts/page.tsx', code);
console.log("Contacts fixed");
