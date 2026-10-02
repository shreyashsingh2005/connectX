const fs = require('fs');

let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// 1. Add `activeTheme`
code = code.replace(
  "const [showActions, setShowActions] = useState(false);",
  "const activeTheme = useThemeStore(s => s.getEffectiveTheme(message.conversation_id));\n  const [showActions, setShowActions] = useState(false);"
);

// 2. Add style block to the main message div
// Look for: className={cn('relative rounded-[18px] px-4 py-2.5 message-animate', ...)}
// We'll add the style attribute to the <div ref={bubbleRef} ... >
code = code.replace(
  /className=\{cn\([\s\S]*?'relative rounded-\[18px\] px-4 py-2\.5 message-animate'[\s\S]*?\)\}/,
  `$& style={isOwn && !isEmojiOnly ? { backgroundColor: activeTheme.accentColor === 'purple' ? '#8B5CF6' : activeTheme.accentColor === 'blue' ? '#3B82F6' : activeTheme.accentColor === 'pink' ? '#EC4899' : activeTheme.accentColor === 'green' ? '#10B981' : '#F97316' } : {}}`
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', code, 'utf8');
console.log('Fixed MessageBubble theme');
