const fs = require('fs');
let file = fs.readFileSync('src/store/useChatStore.ts', 'utf8');

file = file.replace(
  `updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;`,
  `updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;\n  bulkUpdateMessages: (conversationId: string, updates: { id: string; changes: Partial<Message> }[]) => void;`
);

file = file.replace(
  `updateMessage: (conversationId, messageId, updates) =>`,
  `bulkUpdateMessages: (conversationId, updatesList) => set((state) => {
    const messages = state.messages[conversationId] || [];
    const newMessages = [...messages];
    
    let hasChanges = false;
    updatesList.forEach(update => {
      const idx = newMessages.findIndex((m) => m.id === update.id);
      if (idx !== -1) {
        newMessages[idx] = { ...newMessages[idx], ...update.changes };
        hasChanges = true;
      }
    });

    if (!hasChanges) return state;

    return {
      messages: {
        ...state.messages,
        [conversationId]: newMessages,
      },
    };
  }),

  updateMessage: (conversationId, messageId, updates) =>`
);

fs.writeFileSync('src/store/useChatStore.ts', file);
