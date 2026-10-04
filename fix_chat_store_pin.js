const fs = require('fs');
let content = fs.readFileSync('src/store/useChatStore.ts', 'utf8');

// Replace Set<string> with Record<string, boolean>
content = content.replace(/pinnedMessageIds: Record<string, Set<string>>;/g, 'pinnedMessageIds: Record<string, Record<string, boolean>>;');
content = content.replace(/setPinnedMessageIds: \(conversationId: string, ids: Set<string>\) => void;/g, 'setPinnedMessageIds: (conversationId: string, ids: string[]) => void;');

// Replace implementation
const newImpl = `
  setPinnedMessageIds: (conversationId, ids) => set((state) => {
    const map: Record<string, boolean> = {};
    ids.forEach(id => map[id] = true);
    return {
      pinnedMessageIds: { ...state.pinnedMessageIds, [conversationId]: map }
    };
  }),
  addPinnedMessageId: (conversationId, messageId) => set((state) => {
    const currentMap = state.pinnedMessageIds[conversationId] || {};
    return {
      pinnedMessageIds: {
        ...state.pinnedMessageIds,
        [conversationId]: { ...currentMap, [messageId]: true }
      }
    };
  }),
  removePinnedMessageId: (conversationId, messageId) => set((state) => {
    const currentMap = { ...(state.pinnedMessageIds[conversationId] || {}) };
    delete currentMap[messageId];
    return {
      pinnedMessageIds: {
        ...state.pinnedMessageIds,
        [conversationId]: currentMap
      }
    };
  }),
`;

const implRegex = /setPinnedMessageIds: \(conversationId, ids\) => set\(\(state\) => \(\{[\s\S]*?pinnedMessageIds: \{ \.\.\.state\.pinnedMessageIds, \[conversationId\]: ids \}\s*\}\)\),[\s\S]*?addPinnedMessageId: \(conversationId, messageId\) => set\(\(state\) => \{[\s\S]*?return \{ pinnedMessageIds: \{ \.\.\.state\.pinnedMessageIds, \[conversationId\]: setIds \} \};\s*\}\),[\s\S]*?removePinnedMessageId: \(conversationId, messageId\) => set\(\(state\) => \{[\s\S]*?return \{ pinnedMessageIds: \{ \.\.\.state\.pinnedMessageIds, \[conversationId\]: setIds \} \};\s*\}\),/;

if (implRegex.test(content)) {
  content = content.replace(implRegex, newImpl.trim() + ',\n');
  fs.writeFileSync('src/store/useChatStore.ts', content);
  console.log('useChatStore pinned state updated to Record.');
} else {
  console.log('Failed to match useChatStore implementation.');
}
