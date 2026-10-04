const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');

code = code.replace(
  /backgroundColor: resolvedTheme === 'dark' \? \(themeColors\[activeTheme\?\.themeId \|\| 'connect-purple'\]\?\.dark \|\| '\#0B0F12'\) : \(themeColors\[activeTheme\?\.themeId \|\| 'connect-purple'\]\?\.light \|\| '\#F6F7F9'\)/,
  "backgroundImage: resolvedTheme === 'dark' ? `radial-gradient(circle at top right, rgba(167, 139, 250, 0.04), transparent 50%), linear-gradient(${themeColors[activeTheme?.themeId || 'connect-purple']?.dark || '#0B0F12'}, ${themeColors[activeTheme?.themeId || 'connect-purple']?.dark || '#0B0F12'})` : `linear-gradient(${themeColors[activeTheme?.themeId || 'connect-purple']?.light || '#F6F7F9'}, ${themeColors[activeTheme?.themeId || 'connect-purple']?.light || '#F6F7F9'})`"
);

fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', code);
console.log('Chat page background patched');
