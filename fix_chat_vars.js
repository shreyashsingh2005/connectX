const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');

code = code.replace(
  /'--chat-incoming-bg': resolvedTheme === 'dark' \? 'rgba\(255, 255, 255, 0\.07\)' : '\#FFFFFF',/g,
  "'--chat-incoming-bg': 'var(--color-bg-surface)',"
);
code = code.replace(
  /'--chat-incoming-text': resolvedTheme === 'dark' \? '\#F5F7FA' : '\#101828',/g,
  "'--chat-incoming-text': 'var(--color-text-main)',"
);
code = code.replace(
  /'--chat-incoming-muted': resolvedTheme === 'dark' \? '\#A7AFB8' : '\#667085',/g,
  "'--chat-incoming-muted': 'var(--color-text-muted)',"
);
code = code.replace(
  /'--chat-incoming-border': resolvedTheme === 'dark' \? 'rgba\(255, 255, 255, 0\.08\)' : '\#EAECF0',/g,
  "'--chat-incoming-border': 'var(--color-border-subtle)',"
);
code = code.replace(
  /'--chat-outgoing-text': resolvedTheme === 'dark' \? '\#F5F7FA' : '\#FFFFFF',/g,
  "'--chat-outgoing-text': '#FFFFFF',"
);
code = code.replace(
  /'--chat-outgoing-muted': resolvedTheme === 'dark' \? 'rgba\(255, 255, 255, 0\.6\)' : 'rgba\(255, 255, 255, 0\.8\)',/g,
  "'--chat-outgoing-muted': 'rgba(255, 255, 255, 0.75)',"
);
code = code.replace(
  /'--chat-outgoing-border': 'rgba\(255, 255, 255, 0\.15\)',/g,
  "'--chat-outgoing-border': 'rgba(0, 0, 0, 0.05)',"
);
fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', code);
console.log('Chat CSS variables updated');
