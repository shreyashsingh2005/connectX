const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');

content = content.replace(
  `backdrop-blur-xl flex-shrink-0 min-h-[64px]"`,
  `backdrop-blur-xl flex-shrink-0 min-h-[64px] relative z-50"`
);

// I will also add the temporary alert as requested by the user just to prove it visually!
content = content.replace(
  `const handleOpenClearChat = () => {
    console.log("CLEAR_CHAT_BUTTON_FIRED");
    setShowMenu(false);
    setShowClearModal(true);
  };`,
  `const handleOpenClearChat = () => {
    console.log("CLEAR_CHAT_CLICK_WORKS");
    alert("CLEAR CHAT CLICK WORKS");
    setShowMenu(false);
    setShowClearModal(true);
  };`
);

fs.writeFileSync('src/components/chat/ChatHeader.tsx', content);
