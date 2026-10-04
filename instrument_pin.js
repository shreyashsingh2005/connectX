const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

const instrumentedPinClick = `
              onClick={async () => {
                console.log('[PIN-1] CLICK');
                console.log('[PIN-2] HANDLER');
                console.log('[PIN-3] MESSAGE ID:', message.id);
                console.log('[PIN-4] CONVERSATION ID:', message.conversation_id);
                console.log('[PIN-5] USER ID:', currentUserId);
                console.log('[PIN-6] INSERT START');
                try {
                  const supabase = require('@/lib/supabase/client').createClient();
                  const { error, data, status, statusText } = await supabase.from('pinned_messages').insert({
                    message_id: message.id,
                    conversation_id: message.conversation_id,
                    pinned_by: currentUserId
                  });
                  console.log('[PIN-7] INSERT RESPONSE:', { error, data, status, statusText });
                  
                  if (error) {
                    toast.error('Failed to pin: ' + error.message);
                    return;
                  }
                  
                  const { data: verifyData } = await supabase.from('pinned_messages').select('id').eq('message_id', message.id).maybeSingle();
                  console.log('[PIN-8] DB ROW VERIFIED:', !!verifyData);
                  
                  require('react-hot-toast').default.success('Message pinned');
                  console.log('[PIN-9] STORE UPDATED (via realtime)');
                } catch (e: any) {
                  console.error('[PIN] Exception:', e);
                  require('react-hot-toast').default.error(e.message || 'Failed to pin message');
                }
              }}
`;

// Extract old
const regex = /onClick=\{async \(\) => \{\s*try \{\s*const supabase = require\('@\/lib\/supabase\/client'\)\.createClient\(\);\s*const \{ error \} = await supabase\.from\('pinned_messages'\)\.insert\(\{\s*message_id: message\.id,\s*conversation_id: message\.conversation_id,\s*pinned_by: currentUserId\s*\}\);\s*if \(error\) throw error;\s*require\('react-hot-toast'\)\.default\.success\('Message pinned'\);\s*\} catch \(e: any\) \{\s*console\.error\('Failed to pin:', e\);\s*require\('react-hot-toast'\)\.default\.error\(e\.message \|\| 'Failed to pin message'\);\s*\}\s*\}\}/;

content = content.replace(regex, instrumentedPinClick.trim());
fs.writeFileSync('src/components/chat/MessageBubble.tsx', content);
