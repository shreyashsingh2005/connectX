const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

code = code.replace(
  /className="border border-\[#EAECF0\] dark:border-\[#252A34\] bg-white dark:bg-\[#11141A\] shadow-md rounded-\[16px\] flex-shrink-0 px-3 py-2\.5 relative mx-4 mb-4 mt-2"/,
  `className="border border-[#EAECF0] dark:border-[#252A34] bg-white dark:bg-[#11141A] shadow-md rounded-[16px] flex-shrink-0 px-3 py-2.5 relative mx-2 md:mx-4 mb-2 md:mb-4 mt-2" style={{ marginBottom: 'calc(max(env(safe-area-inset-bottom), 8px))' }}`
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log("Updated mobile composer");
