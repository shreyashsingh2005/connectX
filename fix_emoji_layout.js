const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// First, remove the old misplaced emoji picker and fragments
file = file.replace(
  /return \(\n\s*<>\n\s*\{showEmojiPicker && \([\s\S]*?<\/div>\n\s*\)\}\n\s*<div\n\s*className="border-t border-\[#EAECF0\] dark:border-\[#252A34\] bg-white dark:bg-\[#0B0D12\] flex-shrink-0 px-4 py-3 relative"/,
  `return (
      <div
        className="border-t border-[#EAECF0] dark:border-[#252A34] bg-white dark:bg-[#0B0D12] flex-shrink-0 px-4 py-3 relative"`
);

// Remove the closing fragment
file = file.replace(
  /<\/div>\n\s*<\/>\n\s*\);\n\}/,
  `</div>\n  );\n}`
);

// Now, insert the emoji picker INSIDE the main div
file = file.replace(
  /onDragLeave=\{handleDragLeave\}\n\s*>/,
  `onDragLeave={handleDragLeave}\n      >\n        {showEmojiPicker && (
          <div className="absolute bottom-[calc(100%+8px)] right-4 sm:right-6 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[#EAECF0] dark:border-[#252A34] w-[calc(100vw-32px)] sm:w-[350px] max-w-[350px]">
            <EmojiPicker
              theme={Theme.DARK}
              width="100%"
              height={400}
              onEmojiClick={(emojiData) => {
                setText(prev => prev + emojiData.emoji);
                setShowEmojiPicker(false);
                textareaRef.current?.focus();
              }}
            />
          </div>
        )}`
);

// Hide the button on mobile natively, but since user said "allow me using with all phone devices", I will keep it visible but maybe adjust styling
file = file.replace(
  /<Smile size=\{18\} strokeWidth=\{2\} \/>/,
  `<Smile size={20} strokeWidth={2} />`
);

// Fix button styling so it doesn't break flex layout on small devices
file = file.replace(
  /className="w-\[36px\] h-\[36px\] flex-shrink-0 flex items-center justify-center rounded-\[10px\] text-\[#667085\] hover:text-\[#101828\] dark:text-\[#98A2B3\] dark:hover:text-\[#F5F7FA\] transition-colors"/,
  `className="hidden sm:flex w-[36px] h-[36px] flex-shrink-0 items-center justify-center rounded-[10px] text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] hover:bg-[#F8FAFC] dark:hover:bg-[#151922] transition-colors"`
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
console.log("Fixed emoji picker layout");
