const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatThemePicker.tsx', 'utf8');

if (!code.includes('useAuthStore')) {
  code = code.replace(
    "import { useThemeStore",
    "import { useAuthStore } from '@/store/useAuthStore';\nimport { useThemeStore"
  );
  
  code = code.replace(
    "const { globalTheme, chatOverrides, setGlobalTheme, setChatOverride } = useThemeStore();",
    "const { globalTheme, chatOverrides, setGlobalTheme, setChatOverride } = useThemeStore();\n  const { profile } = useAuthStore();"
  );
  
  code = code.replace(
    "setGlobalTheme(previewTheme);",
    "setGlobalTheme(previewTheme, profile?.id);"
  );
  
  code = code.replace(
    "setChatOverride(conversationId, previewTheme);",
    "setChatOverride(conversationId, previewTheme, profile?.id);"
  );
  
  code = code.replace(
    "setChatOverride(conversationId, null);",
    "setChatOverride(conversationId, null, profile?.id);"
  );
  
  fs.writeFileSync('src/components/chat/ChatThemePicker.tsx', code, 'utf8');
  console.log('Updated ChatThemePicker to pass userId');
}
