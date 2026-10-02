const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

if (!code.includes('useThemeStore')) {
  code = code.replace(
    "import { useTheme } from 'next-themes';",
    "import { useTheme } from 'next-themes';\nimport { useThemeStore } from '@/store/useThemeStore';"
  );
}

if (!code.includes('const getEffectiveTheme')) {
  code = code.replace(
    "const profile = useAuthStore(s => s.profile);",
    "const profile = useAuthStore(s => s.profile);\n  const activeTheme = useThemeStore(s => s.getEffectiveTheme)(conversationId);"
  );
}

// Accent logic for send button
const sendBtnAccent = `style={{ backgroundColor: activeTheme.accentColor === 'purple' ? '#8B5CF6' : activeTheme.accentColor === 'blue' ? '#3B82F6' : activeTheme.accentColor === 'pink' ? '#EC4899' : activeTheme.accentColor === 'green' ? '#10B981' : '#F97316' }}`;

// The send button: bg-[#8B5CF6] text-white hover:opacity-90 transition-all shadow-sm shadow-[#8B5CF6]/20
code = code.replace(
  /className="w-\[38px\] h-\[38px\] flex-shrink-0 flex items-center justify-center rounded-full bg-\[\#8B5CF6\] text-white hover:bg-\[\#7C3AED\] transition-all shadow-sm shadow-\[\#8B5CF6\]\/20 disabled:opacity-50"/g,
  `className="w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center rounded-full text-white hover:opacity-90 transition-all shadow-sm disabled:opacity-50"\n            ${sendBtnAccent}`
);

// The empty mic button:
code = code.replace(
  /className=\{`w-\[38px\] h-\[38px\] flex-shrink-0 flex items-center justify-center rounded-full transition-colors \$\{isRecording \? "bg-\[\#F04438\] text-white animate-pulse" : "bg-\[\#8B5CF6\] text-white hover:bg-\[\#7C3AED\] shadow-sm shadow-\[\#8B5CF6\]\/20"}`/g,
  `className={\`w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center rounded-full transition-colors hover:opacity-90 shadow-sm \${isRecording ? "bg-[#F04438] text-white animate-pulse" : "text-white"}\`}\n            ${sendBtnAccent}`
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', code, 'utf8');
console.log("Updated MessageComposer with theme engine");
