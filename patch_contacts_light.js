const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');

// Container Background
code = code.replace(
  /<div className="flex flex-col flex-1 z-10 overflow-hidden relative bg-white dark:bg-\[\#0B0F12\]">/,
  '<div className="flex flex-col flex-1 z-10 overflow-hidden relative bg-[#F8FAFC] dark:bg-[#0B0F12]">'
);

// Light mode tab texts
code = code.replace(
  /"bg-transparent text-\[\#667085\] dark:text-\[\#98A2B3\]"/g,
  '"bg-transparent text-[#667085] dark:text-[#98A2B3]"'
);

// Light mode buttons inside CompactUserRow for "Decline"
code = code.replace(
  /className="h-\[30px\] px-3 bg-\[rgba\(255,255,255,0\.06\)\] text-\[\#A7AFB8\] hover:bg-\[rgba\(255,255,255,0\.1\)\] rounded-\[8px\] text-\[12px\] font-medium transition-colors border border-white\/5"/g,
  'className="h-[30px] px-3 bg-white dark:bg-[rgba(255,255,255,0.06)] text-[#667085] dark:text-[#A7AFB8] hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.1)] rounded-[8px] text-[12px] font-medium transition-colors border border-[#EAECF0] dark:border-white/5 shadow-sm dark:shadow-none"'
);

// Accept button
code = code.replace(
  /className="h-\[30px\] px-3 bg-\[\#8B5CF6\] text-white rounded-\[8px\] text-\[12px\] font-medium hover:bg-\[\#7C3AED\] transition-colors"/g,
  'className="h-[30px] px-3 bg-[#8B5CF6] text-white rounded-[8px] text-[12px] font-medium hover:bg-[#7C3AED] transition-colors shadow-sm dark:shadow-none"'
);

// Add button
code = code.replace(
  /className="h-\[30px\] px-3 bg-\[\#8B5CF6\] text-white rounded-\[8px\] text-\[12px\] font-medium hover:bg-\[\#7C3AED\] transition-colors"/g,
  'className="h-[30px] px-3 bg-[#8B5CF6] text-white rounded-[8px] text-[12px] font-medium hover:bg-[#7C3AED] transition-colors shadow-sm dark:shadow-none"'
);

// Cancel button
code = code.replace(
  /className="h-\[30px\] px-3 bg-\[rgba\(240,68,56,0\.1\)\] text-\[\#F04438\] hover:bg-\[rgba\(240,68,56,0\.2\)\] rounded-\[8px\] text-\[12px\] font-medium transition-colors"/g,
  'className="h-[30px] px-3 bg-[#FEF3F2] dark:bg-[rgba(240,68,56,0.1)] text-[#F04438] hover:bg-[#FEE4E2] dark:hover:bg-[rgba(240,68,56,0.2)] rounded-[8px] text-[12px] font-medium transition-colors"'
);

// Empty States Container Icons and Text
code = code.replace(
  /className="w-\[32px\] h-\[32px\] text-\[\#A7AFB8\] mx-auto mb-3"/g,
  'className="w-[32px] h-[32px] text-[#667085] dark:text-[#A7AFB8] mx-auto mb-3"'
);
code = code.replace(
  /className="text-\[14px\] font-\[600\] text-\[\#F5F7FA\] mb-1"/g,
  'className="text-[14px] font-[600] text-[#101828] dark:text-[#F5F7FA] mb-1"'
);
code = code.replace(
  /className="text-\[12px\] text-\[\#A7AFB8\]"/g,
  'className="text-[12px] text-[#667085] dark:text-[#A7AFB8]"'
);

// Add bg-white for light mode on CompactUserRow (already has hover:bg-gray-50)
code = code.replace(
  /className="flex items-center gap-\[10px\] w-full min-h-\[60px\] h-\[60px\] px-\[10px\] py-\[8px\] border-b border-\[\#EAECF0\] dark:border-\[rgba\(255,255,255,0\.06\)\] last:border-b-0 hover:bg-gray-50 dark:hover:bg-\[rgba\(255,255,255,0\.02\)\] transition-colors duration-150"/g,
  'className="flex items-center gap-[10px] w-full min-h-[60px] h-[60px] px-[10px] py-[8px] border-b border-[#EAECF0] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-transparent last:border-b-0 hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-150"'
);

fs.writeFileSync('src/app/(app)/contacts/page.tsx', code);
console.log('Contacts page light mode colors patched');
