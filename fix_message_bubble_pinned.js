const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

const propAdditions = `
  interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
    showSender?: boolean;
    currentUserId: string;
    isPinned?: boolean;
`;

content = content.replace(/interface MessageBubbleProps \{[^]+?currentUserId: string;/m, propAdditions.trim());

const destructureAdditions = `
    showAvatar = true,
    showSender = false,
    currentUserId,
    isPinned = false,
`;

content = content.replace(/showAvatar = true,\s*showSender = false,\s*currentUserId,/m, destructureAdditions.trim());

// Render Pin indicator inside bubble
const renderIndicator = `
                )}
                {isPinned && <Pin size={12} className="text-gray-400 mt-[2px]" />}
              </span>
            </div>
            {message.reactions && message.reactions.length > 0 && (
`;

content = content.replace(/ \)\}\s*<\/span>\s*<\/div>\s*\{message\.reactions/m, renderIndicator.trim());

// Add memo comparison
content = content.replace(
  /prev\.currentUserId === next\.currentUserId/,
  'prev.currentUserId === next.currentUserId &&\n    prev.isPinned === next.isPinned'
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', content);
