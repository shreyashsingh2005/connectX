const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');

const imports = `
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
`;
content = content.replace(/import \{ memo \} from 'react';/, imports + "\nimport { memo } from 'react';");

const newPinClick = `
              onClick={async () => {
                console.log('[PIN-1] CLICK');
                try {
                  const supabase = createClient();
                  const { error } = await supabase.from('pinned_messages').insert({
                    message_id: message.id,
                    conversation_id: message.conversation_id,
                    pinned_by: currentUserId
                  });
                  if (error) {
                    toast.error('Failed to pin: ' + error.message);
                    return;
                  }
                  toast.success('Message pinned');
                } catch (e: any) {
                  console.error('[PIN] Exception:', e);
                  toast.error(e.message || 'Failed to pin message');
                }
              }}
`;

const regex = /onClick=\{async \(\) => \{[\s\S]*?console\.log\('\[PIN-1\] CLICK'\);[\s\S]*?require\('react-hot-toast'\)\.default\.error\(e\.message \|\| 'Failed to pin message'\);\s*\}\s*\}\}/;
content = content.replace(regex, newPinClick.trim());

fs.writeFileSync('src/components/chat/MessageBubble.tsx', content);
