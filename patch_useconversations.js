const fs = require('fs');
let code = fs.readFileSync('src/hooks/useConversations.tsx', 'utf8');

// Inside `loadConversations`, after setting conversations:
const fetchGlobalPins = `
      // Also fetch global pinned messages for the loaded conversations to populate the sidebar filter
      if (convs.length > 0) {
        const cIds = convs.map((c: any) => c.id);
        const { data: pinsData } = await supabase
          .from('pinned_messages')
          .select('message_id, conversation_id')
          .in('conversation_id', cIds);
          
        if (pinsData) {
          const store = useChatStore.getState();
          const grouped: Record<string, string[]> = {};
          pinsData.forEach((p: any) => {
            if (!grouped[p.conversation_id]) grouped[p.conversation_id] = [];
            grouped[p.conversation_id].push(p.message_id);
          });
          Object.keys(grouped).forEach(cid => {
            store.setPinnedMessageIds(cid, grouped[cid]);
          });
        }
      }
`;

code = code.replace(
  'setConversations(convs);',
  'setConversations(convs);\n' + fetchGlobalPins
);

fs.writeFileSync('src/hooks/useConversations.tsx', code);
console.log('useConversations patched');
