const fs = require('fs');

let text = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

text = text.replace(
  /function DeliveryIcon\(\{ status \}: \{ status: Message\['status'\] \}\) \{[\s\S]*?return null;\n\}/m,
`function DeliveryIcon({ status, isEmojiOnly }: { status: Message['status'], isEmojiOnly?: boolean }) {
  const neutralClass = isEmojiOnly ? "text-gray-400" : "text-white/80 drop-shadow-sm";
  if (status === 'sending') return <Clock className={cn("w-3 h-3", neutralClass)} />;
  if (status === 'sent') return <Check className={cn("w-[14px] h-[14px]", neutralClass)} />;
  if (status === 'delivered') return <CheckCheck className={cn("w-[14px] h-[14px]", neutralClass)} />;
  if (status === 'read') return <CheckCheck className={cn("w-[15px] h-[15px]", isEmojiOnly ? "text-[#38bdf8]" : "text-[#38bdf8] drop-shadow-md brightness-110")} />;
  return null;
}`
);

text = text.replace(
  /\{isOwn && <DeliveryIcon status=\{message\.status\} \/>\}/g,
  '{isOwn && <DeliveryIcon status={message.status} isEmojiOnly={isEmojiOnly} />}'
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', text);
console.log("DeliveryIcon updated");
