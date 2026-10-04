const fs = require('fs');

let layout = fs.readFileSync('src/components/auth/AuthLayout.tsx', 'utf8');

// Update supporting text
layout = layout.replace('Connect with friends, start conversations and share moments.', 'A private, simple and secure way to stay connected.');

// Optional: increase content width to up to 440px
layout = layout.replace('max-w-[400px]', 'max-w-[440px]');
layout = layout.replace('max-w-[280px]', 'max-w-[320px]'); // for text width

// Center the main copy more if needed:
// Currently it's just flex-col justify-between with padding. This naturally puts it around the center depending on the illustration height.

// Fix mobile tagline: "short tagline"
layout = layout.replace('<h1 className="text-[24px] font-bold tracking-tight">connectX</h1>', `<h1 className="text-[24px] font-bold tracking-tight mb-2">connectX</h1>\n        <p className="text-[14px] text-[#A7ADBA] text-center font-medium">A private, simple and secure way to stay connected.</p>`);

fs.writeFileSync('src/components/auth/AuthLayout.tsx', layout);
console.log('Updated AuthLayout.tsx');
