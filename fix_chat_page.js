const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');

if (!code.includes('useThemeStore')) {
  code = code.replace(
    "import { useUIStore } from '@/store/useUIStore';",
    "import { useUIStore } from '@/store/useUIStore';\nimport { useThemeStore } from '@/store/useThemeStore';\nimport { useTheme } from 'next-themes';"
  );
}

// Inject theme hook
if (!code.includes('const themeStore = useThemeStore();')) {
  code = code.replace(
    "const showProfilePanel = useUIStore(s => s.showProfilePanel);",
    "const showProfilePanel = useUIStore(s => s.showProfilePanel);\n  const { resolvedTheme } = useTheme();\n  const getEffectiveTheme = useThemeStore(s => s.getEffectiveTheme);\n  const activeTheme = getEffectiveTheme(conversationId);"
  );
}

// Update the wrapper to use inline styles for the background
const bgRegex = /<div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-\[#FBFBFD\] dark:bg-\[#0B0D12\]">/;
const newWrapper = `
      <div 
        className="flex flex-col flex-1 min-w-0 overflow-hidden relative"
        style={{
          backgroundColor: activeTheme.backgroundId === 'solid' 
            ? (resolvedTheme === 'dark' ? '#0B0D12' : '#FBFBFD') 
            : (resolvedTheme === 'dark' ? '#11141A' : '#F7F8FC')
        }}
      >
        {activeTheme.backgroundId !== 'solid' && (
          <div 
            className="absolute inset-0 pointer-events-none z-0" 
            style={{ 
              backgroundImage: \`url('/patterns/\${activeTheme.backgroundId}.svg')\`,
              opacity: activeTheme.backgroundIntensity / 100,
              color: resolvedTheme === 'dark' ? 'white' : 'black'
            }} 
          />
        )}
        <div className="flex flex-col flex-1 z-10 overflow-hidden relative">
          <ChatHeader conversation={conversation} />
          <MessageList conversationId={conversationId} />
          <MessageComposer conversationId={conversationId} />
        </div>
      </div>
`;
code = code.replace(
  /<div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-\[#FBFBFD\] dark:bg-\[#0B0D12\]">[\s\S]*?<ChatHeader conversation=\{conversation\} \/>[\s\S]*?<MessageList conversationId=\{conversationId\} \/>[\s\S]*?<MessageComposer conversationId=\{conversationId\} \/>[\s\S]*?<\/div>/,
  newWrapper
);

fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', code, 'utf8');
console.log("Updated chat page wrapper with theme engine");
