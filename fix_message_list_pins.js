const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

const hookInjections = `
  const setPinnedMessageIds = useChatStore(s => s.setPinnedMessageIds);
  const addPinnedMessageId = useChatStore(s => s.addPinnedMessageId);
  const removePinnedMessageId = useChatStore(s => s.removePinnedMessageId);
  const pinnedMessageIds = useChatStore(s => s.pinnedMessageIds);

  useEffect(() => {
    async function loadPins() {
      const { data } = await supabase.from('pinned_messages').select('message_id').eq('conversation_id', conversationId);
      if (data) {
        setPinnedMessageIds(conversationId, new Set(data.map(d => d.message_id)));
      }
    }
    loadPins();

    const channel = supabase.channel(\`pins:\${conversationId}\`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pinned_messages', filter: \`conversation_id=eq.\${conversationId}\` }, (payload) => {
        addPinnedMessageId(conversationId, payload.new.message_id);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'pinned_messages', filter: \`conversation_id=eq.\${conversationId}\` }, (payload) => {
        removePinnedMessageId(conversationId, payload.old.message_id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, supabase, setPinnedMessageIds, addPinnedMessageId, removePinnedMessageId]);
`;

if (!content.includes('loadPins()')) {
  content = content.replace(
    'const activeConversationId = useChatStore(s => s.activeConversationId);',
    'const activeConversationId = useChatStore(s => s.activeConversationId);' + hookInjections
  );
  
  // Now pass isPinned to MessageBubble
  content = content.replace(
    /<MessageBubble\s+message=\{msg\}/g,
    '<MessageBubble message={msg} isPinned={pinnedMessageIds[conversationId]?.has(msg.id)}'
  );

  fs.writeFileSync('src/components/chat/MessageList.tsx', content);
  console.log('Pinned message listener injected into MessageList.');
}
