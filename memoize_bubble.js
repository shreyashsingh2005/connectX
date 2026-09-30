const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

file = file.replace(
  /export function MessageBubble\(\{/g,
  `import { memo } from 'react';\n\nexport const MessageBubble = memo(function MessageBubble({`
);

file = file.replace(
  /\}: MessageBubbleProps\) \{/g,
  `}: MessageBubbleProps) {`
);

// We need to add the closing brace for memo() at the end.
// Let's find the end of the file.
const lines = file.split('\n');
const lastClosingBrace = lines.findLastIndex(l => l.trim() === '}');
if (lastClosingBrace !== -1) {
    lines[lastClosingBrace] = '});\n\n// Custom comparison function not strictly needed if we just export default memo(...) but we can use one.\n';
}

fs.writeFileSync('src/components/chat/MessageBubble.tsx', file);
console.log("Wrapped MessageBubble in memo");
