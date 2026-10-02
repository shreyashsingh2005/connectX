const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');

if (!code.includes('</>')) {
  code = code.replace(
    /<\/header>\s*\);\s*\}/,
    "</header>\n    {showThemePicker && <ChatThemePicker conversationId={conversation.id} onClose={() => setShowThemePicker(false)} />}\n    </>\n  );\n}"
  );
  fs.writeFileSync('src/components/chat/ChatHeader.tsx', code, 'utf8');
}
console.log('Fixed chat header tail');
