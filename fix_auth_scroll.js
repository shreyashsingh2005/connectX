const fs = require('fs');

let layout = fs.readFileSync('src/components/auth/AuthLayout.tsx', 'utf8');

// Container
layout = layout.replace(
  /<div className="min-h-\[100dvh\] w-full flex flex-col md:flex-row bg-bg-surface overflow-hidden">/,
  '<div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-bg-surface overflow-x-hidden md:overflow-hidden">'
);

// Right Panel
layout = layout.replace(
  /<div className="flex-1 flex flex-col items-center justify-center px-5 py-8 md:p-12 bg-bg-surface relative z-10">/,
  '<div className="flex-1 flex flex-col items-center justify-center px-5 py-8 md:p-12 bg-bg-surface relative z-10 overflow-y-auto">'
);

fs.writeFileSync('src/components/auth/AuthLayout.tsx', layout);
console.log('Fixed AuthLayout scroll behavior');
