const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

const regex = /const sendTypingStatus = useCallback\(async \(\w+: boolean\) => \{[\s\S]*?\}, \[conversationId, profile\]\);/m;

// We will replace sendTypingStatus entirely.
file = file.replace(
  /const sendTypingStatus = useCallback\(async \(typing: boolean\) => \{[\s\S]*?\}, \[conversationId, profile, supabase\]\);/m,
  `const sendTypingStatus = useCallback(async (typing: boolean) => {
    if (!profile) return;
    const channels = supabase.getChannels();
    const channel = channels.find(c => c.topic === \`room:\${conversationId}\`);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: typing ? 'typing' : 'stop_typing',
        payload: { userId: profile.id, username: profile.display_name },
      });
    }
  }, [conversationId, profile, supabase]);`
);

// wait, the dependency array might just be [conversationId, profile].
file = file.replace(
  /const sendTypingStatus = useCallback\(async \(typing: boolean\) => \{[\s\S]*?\}, \[conversationId, profile\]\);/m,
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
  }, [conversationId, profile, supabase]);`
);

fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
