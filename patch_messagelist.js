const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

code = code.replace(
  'const setMessages = useChatStore(s => s.setMessages);',
  'const setMessages = useChatStore(s => s.setMessages);\n  const setPinnedMessageIds = useChatStore(s => s.setPinnedMessageIds);\n  const addPinnedMessageId = useChatStore(s => s.addPinnedMessageId);\n  const removePinnedMessageId = useChatStore(s => s.removePinnedMessageId);\n  const pinnedMessageIds = useChatStore(s => s.pinnedMessageIds);'
);

const pinEffect = `
  useEffect(() => {
    if (!conversationId) return;
    async function loadPins() {
      const { data } = await supabase.from('pinned_messages').select('message_id').eq('conversation_id', conversationId);
      if (data) setPinnedMessageIds(conversationId, data.map(d => d.message_id));
    }
    loadPins();

    const channel = supabase.channel('pins_' + conversationId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pinned_messages', filter: 'conversation_id=eq.' + conversationId }, (payload) => {
        addPinnedMessageId(conversationId, payload.new.message_id);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'pinned_messages', filter: 'conversation_id=eq.' + conversationId }, (payload) => {
        removePinnedMessageId(conversationId, payload.old.message_id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, supabase, setPinnedMessageIds, addPinnedMessageId, removePinnedMessageId]);
`;

code = code.replace(
  'const previousLengthRef = useRef(messages.length);',
  pinEffect + '\n  const previousLengthRef = useRef(messages.length);'
);

// We should replace any existing `<MessageBubble message={msg}`
code = code.replace(
  /<MessageBubble\s+message=\{msg\}/g,
  '<MessageBubble message={msg} isPinned={!!pinnedMessageIds[conversationId]?.[msg.id]}'
);

// We need to make sure we remove the OLD isPinned I incorrectly passed if it exists
code = code.replace(
  /isPinned=\{pinnedMessageIds\[conversationId\]\?\.has\(msg\.id\)\}/g,
  ''
);

fs.writeFileSync('src/components/chat/MessageList.tsx', code);
console.log('MessageList patched');
