const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// For Change password
content = content.replace(
  /<button className="flex items-center justify-between p-3 hover:bg-\[#F9FAFB\] dark:hover:bg-\[#151922\] rounded-\[12px\] transition-colors group outline-none">\s*<span className="text-\[14px\] font-medium text-\[#101828\] dark:text-\[#F5F7FA\]">Change password<\/span>/g,
  '<button onClick={() => setShowPasswordModal(true)} className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">\n                     <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Change password</span>'
);

// For Manage sessions
content = content.replace(
  /<button className="flex items-center justify-between p-3 hover:bg-\[#F9FAFB\] dark:hover:bg-\[#151922\] rounded-\[12px\] transition-colors group outline-none">\s*<span className="text-\[14px\] font-medium text-\[#101828\] dark:text-\[#F5F7FA\]">Manage sessions<\/span>/g,
  '<button onClick={() => setShowSessionsModal(true)} className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">\n                     <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Manage sessions</span>'
);

fs.writeFileSync('src/app/(app)/settings/page.tsx', content);
