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

file = file.replace(
  /\{message\.type === 'text' && message\.content && \(\s*<p className="text-sm leading-relaxed whitespace-pre-wrap break-words">\{displayContent\}<\/p>\s*\)\}/,
  `{message.type === 'text' && message.content && (
            needsDecryption ? (
              <div className="flex flex-col gap-1.5 w-32 py-1 animate-pulse transition-opacity duration-200">
                <div className={cn("h-2.5 rounded-full", isOwn ? "bg-white/30" : "bg-gray-300 dark:bg-gray-600")}></div>
                <div className={cn("h-2.5 w-4/5 rounded-full", isOwn ? "bg-white/30" : "bg-gray-300 dark:bg-gray-600")}></div>
              </div>
            ) : (
              <p className={cn(
                "text-[15px] leading-relaxed whitespace-pre-wrap break-words",
                displayContent?.startsWith('[Unable') && "italic opacity-80 text-[13px]"
              )}>
                {displayContent}
              </p>
            )
          )}`
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', file);
