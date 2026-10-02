const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');

if (!code.includes('useThemeStore')) {
  code = code.replace(
    "import { formatLastSeen, cn } from '@/lib/utils';",
    "import { formatLastSeen, cn } from '@/lib/utils';\nimport { useThemeStore } from '@/store/useThemeStore';\nimport { Palette } from 'lucide-react';"
  );
}

if (!code.includes('const setChatOverride')) {
  code = code.replace(
    "const [showMenu, setShowMenu] = useState(false);",
    "const [showMenu, setShowMenu] = useState(false);\n  const { setChatOverride, chatOverrides } = useThemeStore();"
  );
}

const themeMenuButton = `
              <button
                onClick={() => {
                  setChatOverride(conversation.id, chatOverrides[conversation.id] ? null : { themeId: 'midnight', backgroundId: 'waves', accentColor: 'blue', backgroundIntensity: 30 });
                  setShowMenu(false);
                  toast.success(chatOverrides[conversation.id] ? 'Removed custom theme' : 'Applied custom Ocean theme');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252A34] transition-colors"
              >
                <Palette className="w-4 h-4" />
                <span>{chatOverrides[conversation.id] ? 'Reset Theme' : 'Set Custom Theme'}</span>
              </button>
`;

if (!code.includes('Set Custom Theme')) {
  code = code.replace(
    /<button\s*onClick=\{clearChat\}[\s\S]*?Clear chat\s*<\/button>/,
    match => themeMenuButton + '\n              ' + match
  );
}

fs.writeFileSync('src/components/chat/ChatHeader.tsx', code, 'utf8');
console.log("Updated ChatHeader with theme override");
