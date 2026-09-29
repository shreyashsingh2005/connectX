const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

// Match everything from const sendTypingStatus to the end of the useCallback
file = file.replace(
  /const sendTypingStatus = useCallback\(async \(typing: boolean\) => \{[\s\S]*?\}, \[profile, conversationId, supabase\]\);/m,
  `const sendTypingStatus = useCallback(async (typing: boolean) => {
    if (!profile) return;
    const channels = supabase.getChannels();
    const channel = channels.find(c => c.topic === \`room:\${conversationId}\`);
    if (channel) {
      try {
        await channel.send({
          type: 'broadcast',
          event: typing ? 'typing' : 'stop_typing',
          payload: { userId: profile.id, username: profile.display_name },
        });
      } catch (e) {}
    }
  }, [profile, conversationId, supabase]);`
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
