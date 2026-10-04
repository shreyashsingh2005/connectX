const fs = require('fs');

let layout = fs.readFileSync('src/components/auth/AuthLayout.tsx', 'utf8');

// Compact Mobile Brand Section
layout = layout.replace(/py-10 px-6/g, 'py-8 px-5');
layout = layout.replace(/w-\[48px\] h-\[48px\] bg-brand text-white rounded-\[14px\] flex items-center justify-center mb-4 shadow-lg shadow-brand\/20/g, 'w-[40px] h-[40px] bg-brand text-white rounded-[12px] flex items-center justify-center mb-3 shadow-md shadow-brand/20');
layout = layout.replace(/<ConnectXLogo size=\{28\} \/>/g, '<ConnectXLogo size={24} />');
layout = layout.replace(/<h1 className="text-\[24px\] font-bold tracking-tight mb-2">connectX<\/h1>/g, '<h1 className="text-[22px] font-bold tracking-tight mb-1">connectX</h1>');

// Padding on mobile auth form wrapper
layout = layout.replace(/p-6 md:p-12/g, 'px-5 py-8 md:p-12');

fs.writeFileSync('src/components/auth/AuthLayout.tsx', layout);
console.log('Updated AuthLayout mobile padding');
