const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');

// 1. Container
code = code.replace(/w-full max-w-\[680px\] mx-auto px-\[20px\] py-\[24px\]/g, 'w-full max-w-[720px] mx-auto px-4 md:px-6 py-4 md:py-6');
code = code.replace(/text-\[22px\] leading-\[28px\] font-\[650\] text-text-main tracking-tight mb-\[16px\]/g, 'text-[22px] font-[700] text-text-main mb-6');

// 2. Search Input
code = code.replace(/h-\[40px\] pl-\[36px\] pr-\[12px\]/g, 'h-[42px] pl-[36px] pr-[12px]');

// 3. Tabs
code = code.replace(/<div className="flex p-\[3px\] bg-bg-secondary rounded-\[10px\] h-\[38px\] mb-\[16px\] border border-\[#E2E8F0\] border-border-subtle">/g, '<div className="flex p-1 bg-bg-secondary rounded-[10px] h-[40px] mb-6 border border-border-subtle">');
code = code.replace(/bg-bg-surface text-text-main border border-border-subtle shadow-\[0_1px_2px_rgba\(0,0,0,0\.05\)\]/g, 'bg-brand/10 text-brand shadow-none');

// 4. Rows Container
code = code.replace(/rounded-\[12px\] overflow-hidden/g, 'rounded-[10px] overflow-hidden');

// 5. Compact User Row
code = code.replace(/w-full min-h-\[60px\] h-\[60px\] px-\[10px\] py-\[8px\] border-b border-border-subtle bg-bg-surface dark:bg-transparent last:border-b-0 hover:bg-bg-secondary transition-colors duration-150/g, 'w-full h-[64px] px-4 border-b border-border-subtle bg-transparent last:border-b-0 hover:bg-bg-secondary transition-colors duration-150');

// 6. Action Buttons in Row
// Action gap
code = code.replace(/gap-1\.5 ml-2/g, 'gap-2 ml-2');
// Add
code = code.replace(/className="h-\[32px\] px-\[12px\] bg-brand text-white rounded-\[8px\] text-\[12px\] font-\[600\] hover:bg-brand-dark transition-colors shadow-sm dark:shadow-none"/g, 'className="h-[32px] px-4 bg-brand text-white rounded-[8px] text-[12px] font-[600] hover:bg-brand-dark transition-colors"');
// Message
code = code.replace(/className="flex items-center gap-1\.5 h-\[32px\] px-\[12px\] bg-brand\/10 hover:bg-brand\/20 text-brand rounded-\[8px\] text-\[12px\] font-\[600\] transition-colors"/g, 'className="flex items-center gap-1.5 h-[32px] px-3 bg-brand/10 hover:bg-brand/20 text-brand rounded-[8px] text-[12px] font-[600] transition-colors"');
// Accept
code = code.replace(/className="h-\[32px\] px-\[12px\] bg-brand text-white rounded-\[8px\] text-\[12px\] font-\[600\] hover:bg-brand-dark transition-colors shadow-sm dark:shadow-none"\s*>[\s\S]*?Accept\s*<\/button>/g, 'className="h-[32px] px-4 bg-brand text-white rounded-[8px] text-[12px] font-[600] hover:bg-brand-dark transition-colors">\n                Accept\n              </button>');
// Decline
code = code.replace(/className="h-\[32px\] px-\[12px\] bg-bg-surface text-text-sec hover:bg-bg-secondary rounded-\[8px\] text-\[12px\] font-\[600\] transition-colors border border-border-subtle border-border-subtle shadow-sm dark:shadow-none"\s*>[\s\S]*?Decline\s*<\/button>/g, 'className="h-[32px] px-4 bg-bg-surface text-text-main hover:bg-bg-secondary rounded-[8px] text-[12px] font-[600] transition-colors border border-border-subtle">\n                Decline\n              </button>');
// Cancel
code = code.replace(/className="h-\[32px\] px-\[12px\] bg-\[#FEF3F2\] dark:bg-\[rgba\(240,68,56,0\.1\)\] text-\[#F04438\] hover:bg-\[#FEE4E2\] dark:hover:bg-\[rgba\(240,68,56,0\.2\)\] rounded-\[8px\] text-\[12px\] font-\[600\] transition-colors"\s*>[\s\S]*?Cancel\s*<\/button>/g, 'className="h-[32px] px-4 bg-bg-surface text-text-main hover:bg-bg-secondary rounded-[8px] text-[12px] font-[600] transition-colors border border-border-subtle">\n              Cancel\n            </button>');


fs.writeFileSync('src/app/(app)/contacts/page.tsx', code);
console.log("Applied Friends UI redesign");
