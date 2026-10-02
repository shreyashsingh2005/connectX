const fs = require('fs');

let code = fs.readFileSync('src/hooks/useAuth.ts', 'utf8');

// Add import
if (!code.includes('useThemeStore')) {
  code = code.replace(
    "import { useChatStore } from '@/store/useChatStore';",
    "import { useChatStore } from '@/store/useChatStore';\nimport { useThemeStore } from '@/store/useThemeStore';"
  );
}

// Extract fetchServerPreferences
if (!code.includes('fetchServerPreferences')) {
  code = code.replace(
    "const chatReset = useChatStore(s => s.reset);",
    "const chatReset = useChatStore(s => s.reset);\n  const fetchServerPreferences = useThemeStore(s => s.fetchServerPreferences);"
  );
  
  code = code.replace(
    "if (profileRes.data) setProfile(profileRes.data);\n    if (settingsRes.data) setSettings(settingsRes.data);\n    setIsLoaded(true);",
    "if (profileRes.data) setProfile(profileRes.data);\n    if (settingsRes.data) setSettings(settingsRes.data);\n    await fetchServerPreferences(userId);\n    setIsLoaded(true);"
  );
  
  code = code.replace(
    "loadProfile(session.user.id);",
    "loadProfile(session.user.id);"
  ); // Keep as is, it's awaited internally where it matters
}

// Clear on SIGNED_OUT
if (code.includes('chatReset();') && !code.includes('useThemeStore.setState')) {
  code = code.replace(
    "chatReset();",
    "chatReset();\n        useThemeStore.setState({ globalTheme: { themeId: 'connect-purple', backgroundId: 'solid', backgroundIntensity: 20, accentColor: 'purple' }, chatOverrides: {} });"
  );
}

fs.writeFileSync('src/hooks/useAuth.ts', code, 'utf8');
console.log('Updated useAuth.ts with theme sync');
