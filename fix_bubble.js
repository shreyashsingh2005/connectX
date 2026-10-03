const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

const getAccentHex = `const getAccentHex = (color) => {
  switch(color) {
    case 'blue': return '#3B82F6';
    case 'pink': return '#EC4899';
    case 'green': return '#10B981';
    case 'orange': return '#F97316';
    case 'purple':
    default: return '#8B5CF6';
  }
};
`;

if (!content.includes('getAccentHex')) {
  content = content.replace('export function MessageBubble', getAccentHex + 'export function MessageBubble');
}

// 1. Remove hardcoded bg-[#8B5CF6]
content = content.replace(
  /isOwn \? `bg-\[#8B5CF6\]/g,
  'isOwn ? `'
);
content = content.replace(
  /isOwn\n\s*\?\s*`bg-\[#8B5CF6\]/g,
  'isOwn\n                ? `'
);
content = content.replace(
  /\? `bg-\[#8B5CF6\] text-white \$\{showAvatar \? 'rounded-\[14px\] rounded-br-\[4px\]' : 'rounded-\[14px\] rounded-r-\[4px\]'\}`/g,
  `? \`text-white \${showAvatar ? 'rounded-[14px] rounded-br-[4px]' : 'rounded-[14px] rounded-r-[4px]'}\``
);

// 2. Add style prop to the bubble div
// We look for: message.status === 'failed' && 'opacity-50'\n              )}\n            >
// And replace it with: message.status === 'failed' && 'opacity-50'\n              )}\n              style={isOwn && !isEmojiOnly ? { backgroundColor: getAccentHex(activeTheme?.accentColor) } : undefined}\n            >

content = content.replace(
  /message\.status === 'failed' && 'opacity-50'\n\s*\)\}\n\s*>/g,
  `message.status === 'failed' && 'opacity-50'\n              )}\n              style={isOwn && !isEmojiOnly ? { backgroundColor: getAccentHex(activeTheme?.accentColor) } : undefined}\n            >`
);

// 3. Fix the reply banner colors
content = content.replace(
  /isOwn \? 'border-\[#8B5CF6\]\/20 bg-\[#8B5CF6\]\/5 dark:bg-\[#8B5CF6\]\/10 text-\[#8B5CF6\]'/g,
  `isOwn ? 'border-transparent bg-black/5 dark:bg-white/10 text-white' ` // wait, if it's inside the bubble, it's white text, so text-white bg-black/10 is better
);
content = content.replace(
  /isOwn \? 'bg-white\/30' : 'bg-gray-300 dark:bg-gray-600'/g,
  `isOwn ? 'bg-white/30' : 'bg-gray-300 dark:bg-gray-600'`
);

// Wait, the reply block is ABOVE the message content, INSIDE the bubble if it's own? No, let's just make it simple.
// It's already in the bubble. If it's own, it uses bg-[#8B5CF6]/5, which doesn't contrast well with dynamic backgrounds.
content = content.replace(
  /isOwn \? 'border-\[#8B5CF6\]\/20 bg-\[#8B5CF6\]\/5 dark:bg-\[#8B5CF6\]\/10 text-\[#8B5CF6\]'/g,
  `isOwn ? 'border-white/20 bg-white/10 text-white'`
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', content);
console.log('Fixed MessageBubble');
