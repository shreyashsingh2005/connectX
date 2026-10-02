const fs = require('fs');

let chatPage = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');
chatPage = chatPage.replace(
  /console\.log\('THEME_RUNTIME_DEBUG:'[\s\S]*?\}\);/m,
  ""
);
fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', chatPage, 'utf8');

let settingsPage = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');
settingsPage = settingsPage.replace(
  /console\.log\('PROFILE_RUNTIME_DEBUG:'[\s\S]*?\}\);/m,
  ""
);
fs.writeFileSync('src/app/(app)/settings/page.tsx', settingsPage, 'utf8');

console.log('Removed debug statements');
