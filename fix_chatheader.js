const fs = require('fs');

let code = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');

// Header height
code = code.replace(/min-h-\[56px\] md:min-h-\[64px\]/g, 'h-[56px] md:h-[60px] min-h-[56px] md:min-h-[60px]');
code = code.replace(/px-5 py-3/g, 'px-5 py-2');

// Avatar
code = code.replace(/w-\[36px\] h-\[36px\] md:w-\[42px\] md:h-\[42px\]/g, 'w-[38px] h-[38px] md:w-[40px] md:h-[40px]');

// Name & Status
code = code.replace(/font-semibold text-text-main text-\[15px\] leading-tight/g, 'font-[650] text-text-main text-[14px] md:text-[15px] leading-tight');
code = code.replace(/text-\[12px\] text-text-sec/g, 'text-[11px] font-[500] text-text-sec');

// Icons
code = code.replace(/<Phone className="w-5 h-5"/g, '<Phone className="w-[18px] h-[18px]" strokeWidth={2}');
code = code.replace(/<Video className="w-5 h-5"/g, '<Video className="w-[18px] h-[18px]" strokeWidth={2}');
code = code.replace(/<Info className="w-5 h-5"/g, '<Info className="w-[18px] h-[18px]" strokeWidth={2}');
code = code.replace(/<MoreVertical className="w-5 h-5"/g, '<MoreVertical className="w-[18px] h-[18px]" strokeWidth={2}');

// Double border
code = code.replace(/border-border-subtle border-border-subtle/g, 'border-border-subtle');

fs.writeFileSync('src/components/chat/ChatHeader.tsx', code);
console.log("ChatHeader fixed");
