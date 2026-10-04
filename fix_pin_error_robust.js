const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

const regex = /onClick=\{async \(\) => \{\s*const supabase = require\('@\/lib\/supabase\/client'\)\.createClient\(\);\s*await supabase\.from\('pinned_messages'\)\.insert\(\{\s*message_id: message\.id,\s*conversation_id: message\.conversation_id,\s*pinned_by: currentUserId\s*\}\);\s*require\('react-hot-toast'\)\.default\.success\('Message pinned'\);\s*\}\}/;

const newPinClick = `onClick={async () => {
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
              }}`;

if (regex.test(content)) {
  content = content.replace(regex, newPinClick);
  fs.writeFileSync('src/components/chat/MessageBubble.tsx', content);
  console.log('Pin button replaced with error handling!');
} else {
  console.log('Regex did not match!');
}
