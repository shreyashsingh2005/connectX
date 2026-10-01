const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

if (code.includes('<EmojiPicker')) {
  // We need to inject the Theme from emoji-picker-react and maybe useTheme
  // actually, let's just use the current theme if possible.
  code = code.replace(
    /<EmojiPicker[\s\S]*?\/>/,
    `<EmojiPicker 
            onEmojiClick={handleEmojiClick}
            theme={typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT}
            lazyLoadEmojis={true}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled={true}
            searchPlaceHolder="Search emoji..."
            width="100%"
            height="400px"
            style={{ 
              '--epr-bg-color': 'var(--epr-bg-color)',
              '--epr-text-color': 'var(--epr-text-color)',
              '--epr-picker-border-color': 'var(--epr-border-color)',
              '--epr-category-icon-active-color': '#8B5CF6',
              '--epr-search-border-color': 'var(--epr-border-color)',
              '--epr-search-input-bg-color': 'transparent',
              '--epr-hover-bg-color': 'var(--epr-hover-bg)',
              '--epr-focus-bg-color': 'var(--epr-hover-bg)',
              '--epr-search-input-height': '38px',
              '--epr-search-input-border-radius': '10px',
              '--epr-category-navigation-button-size': '32px',
              '--epr-emoji-size': '24px',
              '--epr-emoji-padding': '4px'
            } as any}
          />`
  );

  // Fix the wrapper
  code = code.replace(
    /className="absolute bottom-\[100%\] right-0 md:right-4 mb-2 z-\[50\] shadow-xl.*?">/,
    'className="absolute bottom-[100%] right-0 md:right-4 mb-3 z-[50] w-[calc(100vw-24px)] sm:w-[350px] shadow-[0_12px_35px_rgba(16,24,40,0.12)] dark:shadow-none rounded-[16px] overflow-hidden border border-[#EAECF0] dark:border-[#252A34] emoji-picker-wrapper animate-in fade-in slide-in-from-bottom-2 duration-150">'
  );

  // Update Emoji Button Active State
  code = code.replace(
    /className="flex w-\[38px\] h-\[38px\] flex-shrink-0 items-center justify-center rounded-full text-\[#667085\] hover:text-\[#101828\] dark:text-\[#98A2B3\] dark:hover:text-\[#F5F7FA\] hover:bg-\[#F8FAFC\] dark:hover:bg-\[#151922\] transition-colors"/,
    'className={`flex w-[38px] h-[38px] flex-shrink-0 items-center justify-center rounded-full transition-colors ${showEmojiPicker ? "bg-[#8B5CF6]/10 text-[#8B5CF6]" : "text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] hover:bg-[#F8FAFC] dark:hover:bg-[#151922]"}`}'
  );

  // Make sure it does not close the picker if we click inside the picker. Oh wait, handleClickOutside is already doing:
  // const isOutsidePicker = !emojiPickerRef.current.contains(event.target as Node);
  // That's correct.

  fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
  console.log("Updated MessageComposer emoji picker wrapper");
}
