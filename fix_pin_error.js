const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

const oldPinClick = `
              onClick={async () => {
                const supabase = require('@/lib/supabase/client').createClient();
                await supabase.from('pinned_messages').insert({
                  message_id: message.id,
                  conversation_id: message.conversation_id,
                  pinned_by: currentUserId
                });
                require('react-hot-toast').default.success('Message pinned');
              }}
`.trim();

const newPinClick = `
              onClick={async () => {
                try {
                  const supabase = require('@/lib/supabase/client').createClient();
                  const { error } = await supabase.from('pinned_messages').insert({
                    message_id: message.id,
                    conversation_id: message.conversation_id,
                    pinned_by: currentUserId
                  });
                  if (error) throw error;
                  require('react-hot-toast').default.success('Message pinned');
                } catch (e: any) {
                  console.error('Failed to pin:', e);
                  require('react-hot-toast').default.error(e.message || 'Failed to pin message');
                }
              }}
`.trim();

content = content.replace(oldPinClick, newPinClick);

fs.writeFileSync('src/components/chat/MessageBubble.tsx', content);
