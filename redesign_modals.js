const fs = require('fs');
const files = [
  'src/components/modals/GroupChatModal.tsx',
  'src/components/modals/NewChatModal.tsx',
  'src/components/modals/IncomingCallModal.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Background and border
    code = code.replace(
      /bg-white dark:bg-\[\#11141A\] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-\[\#EAECF0\] dark:border-\[\#252A34\]/g,
      'bg-white/95 dark:bg-[#11161B]/95 backdrop-blur-[24px] w-full max-w-md rounded-[20px] p-6 shadow-2xl border border-[#EAECF0] dark:border-white/5'
    );
    
    // For specific matches like max-w-sm
    code = code.replace(
      /bg-white dark:bg-\[\#11141A\] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-\[\#EAECF0\] dark:border-\[\#252A34\]/g,
      'bg-white/95 dark:bg-[#11161B]/95 backdrop-blur-[24px] w-full max-w-sm rounded-[20px] p-6 shadow-2xl border border-[#EAECF0] dark:border-white/5'
    );
    
    // In case of slight variations
    code = code.replace(
      /bg-white dark:bg-\[\#151922\] w-full/g,
      'bg-white/95 dark:bg-[#11161B]/95 backdrop-blur-[24px] w-full'
    );
    
    fs.writeFileSync(file, code);
  }
}
console.log('Modals patched');
