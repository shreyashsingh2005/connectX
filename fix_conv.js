const fs = require('fs');
let text = fs.readFileSync('src/hooks/useConversations.tsx', 'utf8');

text = text.replace(
  /} else if \(!isActive && !isOwn\) {\s*\/\/ Show toast notification/g,
  `} else if (!isActive && !isOwn) {
              // Mark as delivered for non-active conversation
              await supabase.from('messages').update({ status: 'delivered' }).eq('id', newMsgRaw.id).eq('status', 'sent');

              // Show toast notification`
);

fs.writeFileSync('src/hooks/useConversations.tsx', text, 'utf8');
console.log("Updated useConversations.tsx");
