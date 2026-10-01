const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

if (!code.includes('Lock,')) {
  code = code.replace(
    /Video,/,
    "Video,\n  Lock,"
  );
}

// Add decryption error render
if (!code.includes('message.decryption_error')) {
  code = code.replace(
    /if \(message\.is_deleted\) \{/,
    `if (message.decryption_error) {
    return (
      <div className={cn('flex gap-2 mb-1 group', isOwn ? 'flex-row-reverse' : 'flex-row')}>
        {!isOwn && showAvatar ? (
          <UserAvatar src={message.sender?.avatar_url} name={message.sender?.display_name || '?'} size="sm" className="w-[28px] h-[28px] self-end mb-1" />
        ) : (!isOwn && <div className="w-[28px] flex-shrink-0" />)}
        
        <div className={cn(
          'max-w-[78%] md:max-w-[65%] rounded-[16px] px-4 py-3 text-[13px] border flex items-center gap-3',
          isOwn ? 'border-[#8B5CF6]/20 bg-[#8B5CF6]/5 dark:bg-[#8B5CF6]/10 text-[#8B5CF6]' : 'border-[#EAECF0] dark:border-[#252A34] bg-[#F8FAFC] dark:bg-[#151922] text-[#667085] dark:text-[#98A2B3]'
        )}>
          <Lock size={16} className="opacity-70 flex-shrink-0" /> 
          <span>Unable to decrypt this message</span>
        </div>
      </div>
    );
  }

  if (message.is_deleted) {`
  );
}

fs.writeFileSync('src/components/chat/MessageBubble.tsx', code, 'utf8');
console.log("Updated MessageBubble to handle decryption_error");
