const fs = require('fs');

let reg = fs.readFileSync('src/app/(auth)/register/page.tsx', 'utf8');

// Update inputClass
reg = reg.replace(
  /const inputClass = ".*?";/,
  'const inputClass = "w-full bg-bg-surface dark:bg-[#0B0D12] border border-border-subtle rounded-[10px] h-[44px] px-[14px] text-text-main text-[14px] placeholder-text-muted focus:outline-none focus:border-brand focus:ring-[1px] focus:ring-brand/30 transition-all shadow-sm";'
);

// Heading and Subtitle
reg = reg.replace(/<h2 className="text-\[30px\] md:text-\[32px\] font-\[700\] text-text-main leading-tight tracking-tight mb-2">/, '<h2 className="text-[28px] md:text-[32px] font-[650] md:font-[700] text-text-main leading-tight tracking-tight mb-2">');
reg = reg.replace(/<p className="text-\[14px\] text-text-sec mb-8">/, '<p className="text-[14px] md:text-[15px] text-text-muted mb-8">');

// Google Button: "outlined/subtle surface"
reg = reg.replace(
  /<button onClick=\{handleGoogleLogin\} disabled=\{loading\} className="w-full h-\[44px\] bg-white dark:bg-\[#1A1D27\] border border-\[#E6E4EC\] dark:border-\[#2A2E3B\] text-\[14px\] font-\[500\] text-text-main rounded-\[10px\] hover:bg-\[#F9FAFB\] dark:hover:bg-\[#202430\] transition-colors flex items-center justify-center gap-3 disabled:opacity-50"\s*>/,
  '<button onClick={handleGoogleLogin} disabled={loading} className="w-full h-[44px] bg-bg-surface dark:bg-transparent border border-border-subtle text-[14px] font-[500] text-text-main rounded-[10px] hover:bg-bg-secondary transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm">'
);

fs.writeFileSync('src/app/(auth)/register/page.tsx', reg);
console.log('Updated register/page.tsx');
