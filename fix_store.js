const fs = require('fs');
let code = fs.readFileSync('src/store/useChatStore.ts', 'utf8');

// Fix the ID swap logic to guarantee the new message is inserted if it doesn't exist
const oldSwapLogic = `        // If we are changing the ID (e.g. tempId -> realId) and the realId already exists (e.g. from realtime)
        if (newId && newId !== messageId && current.some(m => m.id === newId)) {
          return {
            messages: {
              ...state.messages,
              // Filter out the old tempId, and merge updates into the realId
              [conversationId]: current
                .filter(m => m.id !== messageId)
                .map(m => m.id === newId ? mergeMessage(m, updates) : m)
            }
          };
        }`;

const newSwapLogic = `        // If we are changing the ID (e.g. tempId -> realId)
        if (newId && newId !== messageId) {
          const filtered = current.filter(m => m.id !== messageId);
          const exists = filtered.some(m => m.id === newId);
          
          return {
            messages: {
              ...state.messages,
              [conversationId]: exists 
                ? filtered.map(m => m.id === newId ? mergeMessage(m, updates) : m)
                : [...filtered, { ...current.find(m => m.id === messageId)!, ...updates } as Message]
            }
          };
        }`;

code = code.replace(oldSwapLogic, newSwapLogic);
fs.writeFileSync('src/store/useChatStore.ts', code, 'utf8');
console.log('Fixed useChatStore ID swap logic');
