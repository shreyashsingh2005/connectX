const fs = require('fs');
let code = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

// I also need to update the addPinnedMessageId inside MessageBubble if we are going to update the store on success.
// Wait! We can use `useChatStore.getState().addPinnedMessageId` to avoid adding it to props!
// Zustand allows `useChatStore.getState()`.

const newPinClick = `
              onClick={async () => {
                console.log('[PIN-CLICK] messageId:', message.id, 'current isPinned:', isPinned);
                try {
                  const supabase = createClient();
                  const { useChatStore } = require('@/store/useChatStore');
                  
                  if (isPinned) {
                    console.log('[PIN-DELETE] start');
                    const { error } = await supabase.from('pinned_messages').delete().eq('message_id', message.id);
                    if (error) throw error;
                    console.log('[PIN-DELETE] success');
                    useChatStore.getState().removePinnedMessageId(message.conversation_id, message.id);
                    toast.success('Message unpinned');
                  } else {
                    console.log('[PIN-INSERT] start');
                    const { error } = await supabase.from('pinned_messages').insert({
                      message_id: message.id,
                      conversation_id: message.conversation_id,
                      pinned_by: currentUserId
                    });
                    
                    if (error) {
                      if (error.code === '23505') {
                        console.log('[PIN-INSERT] duplicate key, already pinned');
                      } else {
                        throw error;
                      }
                    }
                    console.log('[PIN-INSERT] success');
                    useChatStore.getState().addPinnedMessageId(message.conversation_id, message.id);
                    toast.success('Message pinned');
                  }
                } catch (e: any) {
                  console.error('[PIN] Exception:', e);
                  toast.error(e.message || 'Failed to toggle pin');
                }
              }}
`;

const regex = /onClick=\{async \(\) => \{[\s\S]*?console\.log\('\[PIN-1\] CLICK'\);[\s\S]*?toast\.error\(e\.message \|\| 'Failed to pin message'\);\s*\}\s*\}\}/;

code = code.replace(regex, newPinClick.trim());

// Also update the icon/title
code = code.replace(
  'title="Pin Message"',
  'title={isPinned ? "Unpin Message" : "Pin Message"}'
);

// Add the Pin icon color
code = code.replace(
  '<Pin className="w-3.5 h-3.5" />',
  '<Pin className={cn("w-3.5 h-3.5", isPinned && "fill-current text-gray-900 dark:text-white")} />'
);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', code);
console.log('MessageBubble patched');
