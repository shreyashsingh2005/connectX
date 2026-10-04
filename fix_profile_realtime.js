const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

const profileRealtime = `
  useEffect(() => {
    const channel = supabase.channel(\`profile_pins:\${conversation.id}\`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pinned_messages', filter: \`conversation_id=eq.\${conversation.id}\` }, () => {
        loadMedia();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversation.id, supabase]);
`;

if (!content.includes('profile_pins:')) {
  content = content.replace(
    'useEffect(() => {\n    loadMedia();\n    if (isDirect && otherUser && profile) checkBlocked();\n  }, [conversation.id]);',
    'useEffect(() => {\n    loadMedia();\n    if (isDirect && otherUser && profile) checkBlocked();\n  }, [conversation.id]);\n' + profileRealtime
  );
  fs.writeFileSync('src/components/chat/ProfilePanel.tsx', content);
  console.log('ProfilePanel realtime listener added.');
}
