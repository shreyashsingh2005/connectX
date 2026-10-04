const fs = require('fs');

let forgot = fs.readFileSync('src/app/(auth)/forgot-password/page.tsx', 'utf8');

// Update inputClass
forgot = forgot.replace(
  /const inputClass = ".*?";/,
  'const inputClass = "w-full bg-bg-surface dark:bg-[#0B0D12] border border-border-subtle rounded-[10px] h-[44px] px-[14px] text-text-main text-[14px] placeholder-text-muted focus:outline-none focus:border-brand focus:ring-[1px] focus:ring-brand/30 transition-all shadow-sm";'
);

// Heading and Subtitle
forgot = forgot.replace(/<h2 className="text-\[30px\] md:text-\[32px\] font-\[700\] text-text-main leading-tight tracking-tight mb-2">/, '<h2 className="text-[28px] md:text-[32px] font-[650] md:font-[700] text-text-main leading-tight tracking-tight mb-2">');
forgot = forgot.replace(/<p className="text-\[14px\] text-text-sec mb-8">/, '<p className="text-[14px] md:text-[15px] text-text-muted mb-8">');

// Back arrow to be less obtrusive
forgot = forgot.replace(/<Link href="\/login" className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-sec hover:text-text-main transition-colors mb-6">/g, '<Link href="/login" className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-sec hover:text-text-main transition-colors mb-6">');
forgot = forgot.replace(/<ArrowLeft size=\{18\}/g, '<ArrowLeft size={16}');

fs.writeFileSync('src/app/(auth)/forgot-password/page.tsx', forgot);
console.log('Updated forgot-password/page.tsx');
