const fs = require('fs');

function fixChannelSend(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /const channel = supabase\.channel\(\`room:\$\{conversationId\}\`\);/g,
    `const channel = supabase.getChannels().find(c => c.topic === \`realtime:room:\${conversationId}\`) || supabase.channel(\`room:\${conversationId}\`);`
  );
  fs.writeFileSync(file, content);
}

fixChannelSend('src/components/chat/MessageComposer.tsx');
fixChannelSend('src/components/modals/ForwardModal.tsx');
