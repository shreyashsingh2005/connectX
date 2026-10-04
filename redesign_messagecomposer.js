const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// Container
code = code.replace(
  /className="bg-white dark:bg-\[\#151922\] border border-\[\#EAECF0\] dark:border-\[\#252A34\] shadow-sm rounded-\[20px\] flex-shrink-0 p-1\.5 relative transition-all duration-200 focus-within:border-\[\#8B5CF6\]\/40 focus-within:ring-\[3px\] focus-within:ring-\[\#8B5CF6\]\/15 group"/,
  'className="bg-white/80 dark:bg-[#11161B]/80 backdrop-blur-[18px] border border-[#EAECF0] dark:border-white/5 shadow-sm dark:shadow-none rounded-[26px] flex-shrink-0 p-1.5 relative transition-all duration-200 focus-within:border-[#8B5CF6]/40 focus-within:ring-[3px] focus-within:ring-[#8B5CF6]/15 group"'
);

// Attachment + Emoji Buttons
code = code.replace(
  /w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-\[12px\]/g,
  'w-[42px] h-[42px] flex-shrink-0 flex items-center justify-center rounded-full'
);
code = code.replace(
  /w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-\[10px\]/g,
  'w-[36px] h-[36px] flex-shrink-0 flex items-center justify-center rounded-full'
);

// Button icon colors
code = code.replace(
  /text-\[\#98A2B3\] dark:text-\[\#667085\] hover:text-\[\#101828\] dark:hover:text-\[\#F5F7FA\] hover:bg-\[\#F7F8FC\] dark:hover:bg-\[\#11141A\]/g,
  'text-[#98A2B3] dark:text-[#A7AFB8] hover:text-[#101828] dark:hover:text-[#F5F7FA] hover:bg-[#F7F8FC] dark:hover:bg-[rgba(255,255,255,0.04)]'
);

// Send / Mic buttons
code = code.replace(
  /w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-\[12px\] text-white hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50 focus-visible:outline-none focus-visible:ring-\[3px\] focus-visible:ring-\[\#8B5CF6\]\/30 bg-\[\#8B5CF6\]/g,
  'w-[42px] h-[42px] flex-shrink-0 flex items-center justify-center rounded-full text-white hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#8B5CF6]/30 bg-[#8B5CF6]'
);

code = code.replace(
  /className=\{cn\("w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-\[12px\] transition-all hover:opacity-90 active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-\[3px\] focus-visible:ring-\[\#8B5CF6\]\/30 text-white", isRecording \? "bg-\[\#F04438\] animate-pulse" : "bg-\[\#8B5CF6\]"\)\}/g,
  'className={cn("w-[42px] h-[42px] flex-shrink-0 flex items-center justify-center rounded-full transition-all hover:opacity-90 active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#8B5CF6]/30 text-white", isRecording ? "bg-[#F04438] animate-pulse" : "bg-[#8B5CF6]")}'
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code);
console.log('MessageComposer visual patched');
