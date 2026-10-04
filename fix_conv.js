const fs = require('fs');

let code = fs.readFileSync('src/components/chat/ConversationList.tsx', 'utf8');

// Header title to 18px / 600
code = code.replace(/text-\[20px\] font-bold text-text-main/g, 'text-[18px] font-[650] text-text-main tracking-tight');

// Action icons 18px
code = code.replace(/<Users className="w-5 h-5" \/>/g, '<Users className="w-[18px] h-[18px]" strokeWidth={2} />');
code = code.replace(/<Plus className="w-5 h-5" \/>/g, '<Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />');
code = code.replace(/w-\[36px\] h-\[36px\]/g, 'w-[32px] h-[32px]');

// Search to 40px soft background
code = code.replace(/bg-\[#F9FAFB\] dark:bg-bg-surface/g, 'bg-bg-secondary dark:bg-[#1A1D24]');
code = code.replace(/border border-border-subtle border-border-subtle/g, 'border border-border-subtle');
code = code.replace(/rounded-full/g, 'rounded-[10px]');
code = code.replace(/py-2 h-\[40px\] pl-10 pr-4/g, 'h-[36px] pl-[34px] pr-3');
code = code.replace(/left-3\.5/g, 'left-2.5');

// Tabs
code = code.replace(/rounded-full font-medium/g, 'rounded-[8px] font-[600]');
code = code.replace(/px-4 py-1\.5 text-\[13px\]/g, 'px-3 py-1 text-[12px]');

// Rows
code = code.replace(/px-4 py-3/g, 'px-3 py-[10px] rounded-[10px] mx-1 border-none');
code = code.replace(/border-b border-border-subtle border-border-subtle last:border-0/g, 'mb-0.5'); // remove border bottom, add spacing
code = code.replace(/bg-\[#F1F3F5\] dark:bg-\[rgba\(255,255,255,0\.04\)\]/g, 'bg-bg-secondary dark:bg-[rgba(255,255,255,0.04)]');
code = code.replace(/hover:bg-\[#F1F3F5\] dark:hover:bg-\[rgba\(255,255,255,0\.02\)\]/g, 'hover:bg-bg-secondary dark:hover:bg-[rgba(255,255,255,0.02)]');

// Avatars
code = code.replace(/w-\[44px\] h-\[44px\]/g, 'w-[40px] h-[40px]');
code = code.replace(/size="md"/g, 'size="sm"'); // Or explicitly pass className if needed, but we can leave size

// Name
code = code.replace(/font-bold text-\[14px\] truncate/g, 'font-[600] text-[13px] md:text-[14px] truncate tracking-tight');
code = code.replace(/text-\[11px\] flex-shrink-0/g, 'text-[10px] md:text-[11px] font-[500] flex-shrink-0');

fs.writeFileSync('src/components/chat/ConversationList.tsx', code);
console.log("ConversationList fixed");
