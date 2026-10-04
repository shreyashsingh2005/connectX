const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// The segmented control button class mapping
code = code.replace(
  /'bg-bg-surface dark:bg-\[rgba\(255,255,255,0\.04\)\] text-brand shadow-sm border border-border-subtle'/g,
  "'bg-brand/10 text-brand shadow-sm border border-transparent'"
);

// The rows in appearance
code = code.replace(/text-\[15px\] font-medium text-text-main/g, 'text-[14px] font-[500] text-text-main');
code = code.replace(/text-\[14px\] text-text-sec capitalize/g, 'text-[13px] text-text-sec capitalize');
code = code.replace(/flex items-center justify-between p-4 hover:bg-bg-secondary/g, 'flex items-center justify-between px-4 h-[52px] hover:bg-bg-secondary');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Segmented control fixed");
