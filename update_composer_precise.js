const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

const original = `  const sendTypingStatus = useCallback(async (typing: boolean) => {
    if (!profile) return;
    const channel = supabase.channel(\`typing:\${conversationId}:\${Math.random().toString(36).substring(7)}\`);
    if (typing) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: profile.id, username: profile.display_name },
      });
    } else {
      await channel.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { userId: profile.id },
      });
    }
  }, [profile, conversationId, supabase]);`;

const replacement = `  const sendTypingStatus = useCallback(async (typing: boolean) => {
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
  }, [profile, conversationId, supabase]);`;

file = file.replace(original, replacement);
fs.writeFileSync('src/components/chat/MessageComposer.tsx', file);
