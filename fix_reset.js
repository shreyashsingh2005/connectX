const fs = require('fs');

let reset = fs.readFileSync('src/app/(auth)/reset-password/page.tsx', 'utf8');

// Update inputClass
reset = reset.replace(
  /const inputClass = ".*?";/,
  'const inputClass = "w-full bg-bg-surface dark:bg-[#0B0D12] border border-border-subtle rounded-[10px] h-[44px] px-[14px] text-text-main text-[14px] placeholder-text-muted focus:outline-none focus:border-brand focus:ring-[1px] focus:ring-brand/30 transition-all shadow-sm";'
);

// Heading and Subtitle
reset = reset.replace(/<h2 className="text-\[30px\] md:text-\[32px\] font-\[700\] text-text-main leading-tight tracking-tight mb-2">/, '<h2 className="text-[28px] md:text-[32px] font-[650] md:font-[700] text-text-main leading-tight tracking-tight mb-2">');
reset = reset.replace(/<p className="text-\[14px\] text-text-sec mb-8">/, '<p className="text-[14px] md:text-[15px] text-text-muted mb-8">');

fs.writeFileSync('src/app/(auth)/reset-password/page.tsx', reset);
console.log('Updated reset-password/page.tsx');
