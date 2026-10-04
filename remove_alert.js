const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');

content = content.replace(
  `const handleOpenClearChat = () => {
    console.log("CLEAR_CHAT_CLICK_WORKS");
    alert("CLEAR CHAT CLICK WORKS");
    setShowMenu(false);
    setShowClearModal(true);
  };`,
  `const handleOpenClearChat = () => {
    console.log("CLEAR_CHAT_CLICK_WORKS");
    setShowMenu(false);
    setShowClearModal(true);
  };`
);

fs.writeFileSync('src/components/chat/ChatHeader.tsx', content);
