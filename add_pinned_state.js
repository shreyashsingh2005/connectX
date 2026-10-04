const fs = require('fs');
let content = fs.readFileSync('src/store/useChatStore.ts', 'utf8');

const stateInterfaceAdditions = `
  hasMore: Record<string, boolean>;
  pinnedMessageIds: Record<string, Set<string>>;
  setPinnedMessageIds: (conversationId: string, ids: Set<string>) => void;
  addPinnedMessageId: (conversationId: string, messageId: string) => void;
  removePinnedMessageId: (conversationId: string, messageId: string) => void;
`;

content = content.replace(/hasMore: Record<string, boolean>;/, stateInterfaceAdditions.trim());

const defaultStateAdditions = `
  hasMore: {},
  pinnedMessageIds: {},
  setPinnedMessageIds: (conversationId, ids) => set((state) => ({
    pinnedMessageIds: { ...state.pinnedMessageIds, [conversationId]: ids }
  })),
  addPinnedMessageId: (conversationId, messageId) => set((state) => {
    const setIds = new Set(state.pinnedMessageIds[conversationId] || []);
    setIds.add(messageId);
    return { pinnedMessageIds: { ...state.pinnedMessageIds, [conversationId]: setIds } };
  }),
  removePinnedMessageId: (conversationId, messageId) => set((state) => {
    const setIds = new Set(state.pinnedMessageIds[conversationId] || []);
    setIds.delete(messageId);
    return { pinnedMessageIds: { ...state.pinnedMessageIds, [conversationId]: setIds } };
  }),
`;

content = content.replace(/hasMore: \{\},/, defaultStateAdditions.trim());

fs.writeFileSync('src/store/useChatStore.ts', content);
