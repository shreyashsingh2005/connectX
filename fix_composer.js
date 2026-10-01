const fs = require('fs');

let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// 1. Floating composer container
code = code.replace(
  /className="border-t border-\[#EAECF0\] dark:border-\[#252A34\] bg-white dark:bg-\[#0B0D12\] flex-shrink-0 px-4 py-3 relative"/,
  `className="border border-[#EAECF0] dark:border-[#252A34] bg-white dark:bg-[#11141A] shadow-md rounded-[16px] flex-shrink-0 px-3 py-2.5 relative mx-4 mb-4 mt-2"`
);

// 2. Remove internal border/bg from textarea wrapper to make the whole composer feel unified
code = code.replace(
  /className="flex-1 min-h-\[44px\] max-h-32 bg-\[#F8FAFC\] dark:bg-\[#11141A\] border border-\[#EAECF0\] dark:border-\[#252A34\] rounded-\[12px\] flex items-center px-1 focus-within:border-\[#8B5CF6\] focus-within:ring-1 focus-within:ring-\[#8B5CF6\] transition-all overflow-hidden relative"/,
  `className="flex-1 min-h-[40px] max-h-32 bg-transparent flex items-center px-1 transition-all overflow-hidden relative"`
);

// 3. Make Send/Mic buttons circular and premium
code = code.replace(
  /className="w-\[36px\] h-\[36px\] flex-shrink-0 flex items-center justify-center rounded-\[10px\] bg-\[#8B5CF6\] text-white hover:bg-\[#7C3AED\] transition-colors disabled:opacity-50"/,
  `className="w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center rounded-full bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-all shadow-sm shadow-[#8B5CF6]/20 disabled:opacity-50"`
);
code = code.replace(
  /className=\{`w-\[36px\] h-\[36px\] flex-shrink-0 flex items-center justify-center rounded-\[10px\] transition-colors/g,
  "className={`w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center rounded-full transition-colors"
);

// 4. Paperclip and emoji buttons
code = code.replace(
  /className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-\[10px\]/g,
  'className="w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center rounded-full'
);
code = code.replace(
  /className="flex w-\[36px\] h-\[36px\] flex-shrink-0 items-center justify-center rounded-\[10px\]/g,
  'className="flex w-[38px] h-[38px] flex-shrink-0 items-center justify-center rounded-full'
);

// 5. Tooltips (aria-label -> title for native tooltip)
code = code.replace(/aria-label="Attach file"/g, 'aria-label="Attach file" title="Attach file"');
code = code.replace(/aria-label="Send message"/g, 'aria-label="Send message" title="Send message"');
code = code.replace(/aria-label=\{isRecording \? "Stop recording" : "Record voice message"\}/g, 'aria-label={isRecording ? "Stop recording" : "Record voice message"} title={isRecording ? "Stop recording" : "Record voice message"}');
code = code.replace(/<Smile size=\{20\} strokeWidth=\{2\} \/>/g, '<Smile size={20} strokeWidth={2} title="Emoji" />');

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log("Updated MessageComposer.tsx");
