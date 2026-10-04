const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');

code = code.replace(
  /'--chat-incoming-bg': resolvedTheme === 'dark' \? '#151922' : '#FFFFFF',/,
  "'--chat-incoming-bg': resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : '#FFFFFF',"
);
code = code.replace(
  /'--chat-incoming-text': resolvedTheme === 'dark' \? '#F5F7FA' : '#101828',/,
  "'--chat-incoming-text': resolvedTheme === 'dark' ? '#F5F7FA' : '#101828',"
);
code = code.replace(
  /'--chat-incoming-muted': resolvedTheme === 'dark' \? '#98A2B3' : '#667085',/,
  "'--chat-incoming-muted': resolvedTheme === 'dark' ? '#A7AFB8' : '#667085',"
);
code = code.replace(
  /'--chat-incoming-border': resolvedTheme === 'dark' \? '#252A34' : '#EAECF0',/,
  "'--chat-incoming-border': resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#EAECF0',"
);
code = code.replace(
  /backgroundColor: resolvedTheme === 'dark' \? \(themeColors\[activeTheme\?\.themeId \|\| 'connect-purple'\]\?\.dark \|\| '#0B0D12'\) : \(themeColors\[activeTheme\?\.themeId \|\| 'connect-purple'\]\?\.light \|\| '#FBFBFD'\)/,
  "backgroundColor: resolvedTheme === 'dark' ? (themeColors[activeTheme?.themeId || 'connect-purple']?.dark || '#0B0F12') : (themeColors[activeTheme?.themeId || 'connect-purple']?.light || '#F6F7F9')"
);

fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', code);
console.log('Chat page vars patched');
