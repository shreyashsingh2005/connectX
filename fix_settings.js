const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Profile Header
code = code.replace(/size="lg" className="w-\[48px\] h-\[48px\]"/g, 'size="xl" className="w-[60px] h-[60px]"');
code = code.replace(/<h2 className="text-\[16px\] font-semibold text-text-main truncate">\{profile.display_name\}<\/h2>/g, '<h2 className="text-[17px] font-[600] text-text-main truncate">{profile.display_name}</h2>');
code = code.replace(/<p className="text-\[13px\] text-text-sec truncate">@\{profile.username\}<\/p>/g, '<p className="text-[12px] text-text-sec truncate">@{profile.username}</p>');

// Settings Rows
// The rows have `w-full p-3`
code = code.replace(/w-full p-3 hover:bg-bg-secondary/g, 'w-full px-4 h-[54px] hover:bg-bg-secondary');

// Clean up duplicate border-border-subtle classes
code = code.replace(/border-border-subtle border-border-subtle/g, 'border-border-subtle');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Settings fixed");
