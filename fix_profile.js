const fs = require('fs');

function fixProfileFile(path) {
  let code = fs.readFileSync(path, 'utf8');

  // Avatar size is already 80px in `profile/[username]/page.tsx`, let's just make sure
  code = code.replace(/w-\[80px\] h-\[80px\]/g, 'w-[72px] h-[72px]');

  // Name 18px
  code = code.replace(/text-\[22px\] md:text-\[28px\]/g, 'text-[18px]');
  // Username 12px
  code = code.replace(/text-\[14px\] text-text-sec mt-0\.5 truncate/g, 'text-[12px] text-text-sec mt-0.5 truncate');
  code = code.replace(/text-\[14px\] text-text-sec mt-1 truncate/g, 'text-[12px] text-text-sec mt-1 truncate');

  // Buttons 36px (from py-2 -> py-1.5, text-13px -> text-13px h-[36px])
  code = code.replace(/px-4 py-2/g, 'px-[12px] h-[36px]');
  code = code.replace(/px-3 py-2/g, 'px-[12px] h-[36px]');
  
  // Clean borders
  code = code.replace(/border-border-subtle border-border-subtle/g, 'border-border-subtle');
  code = code.replace(/bg-bg-primary border border-border-subtle text-text-sec/g, 'bg-bg-secondary border border-border-subtle text-text-sec');

  fs.writeFileSync(path, code);
}

fixProfileFile('src/app/(app)/profile/page.tsx');
fixProfileFile('src/app/(app)/profile/[username]/page.tsx');
console.log("Profiles fixed");
