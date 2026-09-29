const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

if (!file.includes('useE2EE')) {
  file = file.replace(`import { MessageBubble } from './MessageBubble';`, `import { MessageBubble } from './MessageBubble';\nimport { useE2EE } from '@/hooks/useE2EE';`);
}

file = file.replace(
  `const removeTypingUser = useChatStore(s => s.removeTypingUser);`,
  `const removeTypingUser = useChatStore(s => s.removeTypingUser);\n  const bulkUpdateMessages = useChatStore(s => s.bulkUpdateMessages);`
);

file = file.replace(
  `const isFirstLoad = useRef(true);`,
  `const isFirstLoad = useRef(true);\n  const { isReady, decrypt } = useE2EE(conversationId);\n\n  useEffect(() => {\n    if (!isReady || messages.length === 0) return;\n    \n    const toDecrypt = messages.filter(m => \n      m.content && \n      m.decrypted_content === undefined && \n      m.status !== 'sending' && \n      m.status !== 'failed' &&\n      m.type !== 'system'\n    );\n    \n    if (toDecrypt.length === 0) return;\n\n    let isMounted = true;\n    \n    const processBatch = async () => {\n      const updates = await Promise.all(toDecrypt.map(async msg => {\n        try {\n          const decrypted = await decrypt(msg.content!);\n          return { id: msg.id, changes: { decrypted_content: decrypted } };\n        } catch (e) {\n          return { id: msg.id, changes: { decrypted_content: '[Unable to decrypt message]' } };\n        }\n      }));\n      \n      if (isMounted) {\n        bulkUpdateMessages(conversationId, updates);\n      }\n    };\n    \n    processBatch();\n    \n    return () => { isMounted = false; };\n  }, [messages, isReady, conversationId, bulkUpdateMessages, decrypt]);`
);

fs.writeFileSync('src/components/chat/MessageList.tsx', file);
