const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

if (!code.includes('useThemeStore')) {
  code = code.replace(
    "import { cn, formatMessageTime, formatFileSize, isOnlyEmojis } from '@/lib/utils';",
    "import { cn, formatMessageTime, formatFileSize, isOnlyEmojis } from '@/lib/utils';\nimport { useThemeStore } from '@/store/useThemeStore';"
  );
}

if (!code.includes('const getEffectiveTheme')) {
  code = code.replace(
    "const profile = useAuthStore(s => s.profile);",
    "const profile = useAuthStore(s => s.profile);\n  const activeTheme = useThemeStore(s => s.getEffectiveTheme)(message.conversation_id);"
  );
}

// Replace hardcoded #8B5CF6 with dynamic based on activeTheme.accentColor
const dynamicBubble = "isOwn ? `text-white shadow-sm ${showAvatar ? 'rounded-[18px] rounded-br-[5px]' : 'rounded-[18px] rounded-r-[5px]'}` : `bg-[#FFFFFF] dark:bg-[#171B23] text-[#101828] dark:text-[#F5F7FA] shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-[#EAECF0] dark:border-[#252A34] ${showAvatar ? 'rounded-[18px] rounded-bl-[5px]' : 'rounded-[18px] rounded-l-[5px]'}`";
const dynamicStyle = `style={isOwn ? { backgroundColor: activeTheme.accentColor === 'purple' ? '#8B5CF6' : activeTheme.accentColor === 'blue' ? '#3B82F6' : activeTheme.accentColor === 'pink' ? '#EC4899' : activeTheme.accentColor === 'green' ? '#10B981' : '#F97316' } : undefined}`;

code = code.replace(
  /isOwn \? `bg-\[\#8B5CF6\] text-white shadow-sm \$\{showAvatar \? 'rounded-\[18px\] rounded-br-\[5px\]' : 'rounded-\[18px\] rounded-r-\[5px\]'\}` : `bg-\[\#FFFFFF\] dark:bg-\[\#171B23\] text-\[\#101828\] dark:text-\[\#F5F7FA\] shadow-\[0_1px_2px_rgba\(0,0,0,0\.02\)\] border border-\[\#EAECF0\] dark:border-\[\#252A34\] \$\{showAvatar \? 'rounded-\[18px\] rounded-bl-\[5px\]' : 'rounded-\[18px\] rounded-l-\[5px\]'\}`/,
  dynamicBubble
);

code = code.replace(
  /className=\{`relative px-3\.5 py-2 max-w-\[85%\] md:max-w-\[70%\] break-words \$\{/,
  `${dynamicStyle}\n            className={\`relative px-3.5 py-2 max-w-[85%] md:max-w-[70%] break-words \${`
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', code, 'utf8');
console.log("Updated MessageBubble with theme engine");
