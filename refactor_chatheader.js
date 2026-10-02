const fs = require('fs');

let code = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');

if (!code.includes('ChatThemePicker')) {
  code = code.replace(
    "import { Palette } from 'lucide-react';",
    "import { Palette } from 'lucide-react';\nimport { ChatThemePicker } from '@/components/chat/ChatThemePicker';"
  );
}

if (!code.includes('showThemePicker')) {
  code = code.replace(
    "const [showMenu, setShowMenu] = useState(false);",
    "const [showMenu, setShowMenu] = useState(false);\n  const [showThemePicker, setShowThemePicker] = useState(false);"
  );
}

// Replace the hardcoded onClick with opening the picker
code = code.replace(
  /onClick=\{[^\}]*?setChatOverride\(conversation.id[^\}]*?setShowMenu\(false\);[^\}]*?toast\.success[^\}]*?\}/,
  `onClick={() => { setShowMenu(false); setShowThemePicker(true); }}`
);

// Inject the modal at the bottom
if (!code.includes('<ChatThemePicker')) {
  code = code.replace(
    "return (",
    "return (\n    <>"
  );
  
  code = code.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*$/,
    "</div>\n      </div>\n    </div>\n    {showThemePicker && <ChatThemePicker conversationId={conversation.id} onClose={() => setShowThemePicker(false)} />}\n    </>"
  );
}

fs.writeFileSync('src/components/chat/ChatHeader.tsx', code, 'utf8');
console.log("Updated ChatHeader to use ChatThemePicker");
