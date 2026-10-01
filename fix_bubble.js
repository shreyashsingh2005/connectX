const fs = require('fs');
let text = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf-8');

text = text.replace(
  "import { cn, formatMessageTime } from '@/lib/utils';",
  "import { cn, formatMessageTime, isOnlyEmojis } from '@/lib/utils';"
);

text = text.replace(
  "const displayContent = needsDecryption ? null : (message.decrypted_content ?? message.content);",
  "const displayContent = needsDecryption ? null : (message.decrypted_content ?? message.content);\n  const isEmojiOnly = isOnlyEmojis(displayContent) && (!message.attachments || message.attachments.length === 0) && !message.reply_to_id;"
);

text = text.replace(
  /isOwn\s*\?\s*'bg-\[\#8B5CF6\] text-white rounded-br-sm'\s*:\s*'bg-gray-200 dark:bg-\[\#1F2937\] text-gray-900 dark:text-gray-100 rounded-bl-sm',/g,
  "isEmojiOnly ? 'bg-transparent shadow-none px-0 py-0' : (isOwn ? 'bg-[#8B5CF6] text-white rounded-br-sm shadow-sm' : 'bg-white dark:bg-[#151922] border border-gray-100 dark:border-[#252A34] text-gray-900 dark:text-[#F5F7FA] rounded-bl-sm shadow-sm'),"
);

text = text.replace(
  /"text-\[15px\] leading-relaxed whitespace-pre-wrap break-words"/g,
  "isEmojiOnly ? 'text-[44px] leading-tight' : 'text-[15px] leading-relaxed whitespace-pre-wrap break-words'"
);

text = text.replace(
  /text-\[11px\] \$\{isOwn \? 'font-medium text-white\/80 drop-shadow-sm tracking-wide' : 'opacity-60'\}/g,
  "text-[11px] font-medium tracking-wide ${isEmojiOnly ? (isOwn ? 'text-gray-400' : 'text-gray-500') : (isOwn ? 'text-white/90 drop-shadow-sm' : 'text-gray-500 dark:text-[#98A2B3]')}"
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', text);
