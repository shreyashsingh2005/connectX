const fs = require('fs');

const pinBtn = `
            <button
              onClick={async () => {
                const supabase = require('@/lib/supabase/client').createClient();
                await supabase.from('pinned_messages').insert({
                  message_id: message.id,
                  conversation_id: message.conversation_id,
                  pinned_by: currentUserId
                });
                require('react-hot-toast').default.success('Message pinned');
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
              title="Pin Message"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
`;

let content = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');
content = content.replace(/(<Copy className="w-3\.5 h-3\.5" \/>\s*<\/button>)/, "$1\n" + pinBtn);
fs.writeFileSync('src/components/chat/MessageBubble.tsx', content);
console.log('Done');
