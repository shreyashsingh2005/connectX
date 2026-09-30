const fs = require('fs');
let file = fs.readFileSync('src/components/chat/ConversationList.tsx', 'utf8');

if (!file.includes("const [clearedChats")) {
  file = file.replace(
    /const router = useRouter\(\);/,
    `const router = useRouter();\n  const [clearedChats, setClearedChats] = useState<Record<string, string>>({});\n\n  useEffect(() => {\n    const loadCleared = () => {\n      try {\n        setClearedChats(JSON.parse(localStorage.getItem('cleared_chats') || '{}'));\n      } catch (e) {}\n    };\n    loadCleared();\n    window.addEventListener('storage', loadCleared);\n    // Also listen to a custom event for same-tab updates\n    window.addEventListener('chat_cleared', loadCleared);\n    return () => {\n      window.removeEventListener('storage', loadCleared);\n      window.removeEventListener('chat_cleared', loadCleared);\n    };\n  }, []);`
  );
}

const previewLogic = `
    function getLastMessagePreview(conv: Conversation) {
      const clearedAt = clearedChats[conv.id];
      if (clearedAt && conv.last_message) {
        if (new Date(conv.last_message.created_at) <= new Date(clearedAt)) {
          return 'No messages yet';
        }
      }

      if (!conv.last_message) return 'No messages yet';
      const msg = conv.last_message;
      if (msg.is_deleted) return '?? Message deleted';
`;

file = file.replace(
  /function getLastMessagePreview\(conv: Conversation\) \{\n\s*if \(\!conv\.last_message\) return 'No messages yet';\n\s*const msg = conv\.last_message;\n\s*if \(msg\.is_deleted\) return '?? Message deleted';/,
  previewLogic.trim()
);

fs.writeFileSync('src/components/chat/ConversationList.tsx', file);
console.log("Fixed ConversationList preview logic");
