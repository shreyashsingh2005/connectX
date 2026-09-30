const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

const emojiButton = `
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-[36px] h-[36px] flex-shrink-0 flex items-center justify-center rounded-[10px] text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] transition-colors"
            >
              <Smile size={18} strokeWidth={2} />
            </button>
            <input
`;

file = file.replace(
  /<input\s+type="file"/,
  emojiButton
);

const pickerHtml = `
      {showEmojiPicker && (
        <div className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[#EAECF0] dark:border-[#252A34]">
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={(emojiData) => {
              setText(prev => prev + emojiData.emoji);
              setShowEmojiPicker(false);
              textareaRef.current?.focus();
            }}
          />
        </div>
      )}
      <div
        className="border-t border-[#EAECF0] dark:border-[#252A34] bg-white dark:bg-[#0B0D12] flex-shrink-0 px-4 py-3 relative"
`;

file = file.replace(
  /<div\s+className="border-t border-\[#EAECF0\] dark:border-\[#252A34\] bg-white dark:bg-\[#0B0D12\] flex-shrink-0 px-4 py-3"/,
  pickerHtml
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
console.log("Added emoji picker UI");
