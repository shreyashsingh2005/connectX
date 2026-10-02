const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');

// I need to add a local fallback for conversation.
// First, find the line where conversation is declared.
code = code.replace(
  'const conversation = useChatStore(s => s.conversations.find(c => c.id === conversationId));',
  `const globalConversation = useChatStore(s => s.conversations.find(c => c.id === conversationId));
  const [localConversation, setLocalConversation] = useState<Conversation | null>(null);
  
  useEffect(() => {
    if (globalConversation) {
      setLocalConversation(globalConversation);
    }
  }, [globalConversation]);
  
  const conversation = globalConversation || localConversation;`
);

fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', code, 'utf8');
console.log('Added local fallback');
