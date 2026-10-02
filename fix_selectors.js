const fs = require('fs');

// 1. page.tsx
let chatPage = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');
chatPage = chatPage.replace(
  'const getEffectiveTheme = useThemeStore(s => s.getEffectiveTheme);\n  const activeTheme = getEffectiveTheme(conversationId);',
  'const activeTheme = useThemeStore(s => s.getEffectiveTheme(conversationId));'
);
fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', chatPage, 'utf8');

// 2. MessageComposer.tsx
let composer = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');
composer = composer.replace(
  'const activeTheme = useThemeStore(s => s.getEffectiveTheme)(conversationId);',
  'const activeTheme = useThemeStore(s => s.getEffectiveTheme(conversationId));'
);
fs.writeFileSync('src/components/chat/MessageComposer.tsx', composer, 'utf8');

// 3. ChatHeader.tsx
let header = fs.readFileSync('src/components/chat/ChatHeader.tsx', 'utf8');
header = header.replace(
  'const activeTheme = useThemeStore(s => s.getEffectiveTheme)(conversation.id);',
  'const activeTheme = useThemeStore(s => s.getEffectiveTheme(conversation.id));'
);
fs.writeFileSync('src/components/chat/ChatHeader.tsx', header, 'utf8');

console.log('Fixed Zustand selectors');
