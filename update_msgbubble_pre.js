const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

file = file.replace(
  `import { useE2EE } from '@/hooks/useE2EE';`,
  ``
);

file = file.replace(
  /  const { isReady, decrypt } = useE2EE\(message\.conversation_id\);\s*const \[decryptedContent, setDecryptedContent\] = useState<string \| null>\([\s\S]*?\);\s*useEffect\(\(\) => \{[\s\S]*?\}, \[.*?\]\);\s*const displayContent = decryptedContent \|\| \(message\.content \? 'Decrypting\.\.\.' : null\);/,
  `  const needsDecryption = !!message.content && message.status !== 'sending' && message.status !== 'failed' && message.type !== 'system' && message.decrypted_content === undefined;\n  const displayContent = needsDecryption ? null : (message.decrypted_content ?? message.content);`
);

// We need to replace where it renders displayContent.
// There is usually a <p className="...">{displayContent}</p>
// Let's find it.
