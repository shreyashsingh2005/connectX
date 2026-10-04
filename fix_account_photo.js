const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// The profile photo block replacement
const newProfilePhotoBlock = `            <div className="flex flex-col items-center justify-center py-6 mb-2">
              <div className="relative group cursor-pointer" onClick={() => setShowPhotoEditor(true)}>
                <UserAvatar src={profile.avatar_url} name={profile.display_name} size="2xl" className="w-[72px] h-[72px] shadow-sm" />
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-bg-surface border border-border-subtle rounded-full flex items-center justify-center shadow-sm text-text-sec group-hover:text-brand transition-colors">
                  <Camera size={14} strokeWidth={2} />
                </div>
              </div>
            </div>`;

// Use simple string replacement for the exact block
code = code.replace(
  /<div className="bg-bg-surface rounded-\[10px\] border border-border-subtle overflow-hidden w-full mb-6">\s*<div className="flex items-center gap-5 p-5">[\s\S]*?<\/div>\s*<\/div>/,
  newProfilePhotoBlock
);

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Account Profile Photo updated");
