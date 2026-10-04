const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

const updatedPinnedRender = `
              {activeTab === 'pinned' && (
                pinnedMessages.length > 0 ? (
                  <div className="space-y-3">
                    {pinnedMessages.map(pm => (
                      <PinnedMessageItem key={pm.id} pm={pm} conversationId={conversation.id} removePin={(id) => setPinnedMessages(prev => prev.filter(p => p.id !== id))} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6"><p className="text-xs text-gray-600">No pinned messages</p></div>
                )
              )}
`;

const pinnedMessageItemComponent = `
function PinnedMessageItem({ pm, conversationId, removePin }: { pm: any, conversationId: string, removePin: (id: string) => void }) {
  const { isReady, decrypt } = useE2EE(conversationId);
  const [decryptedText, setDecryptedText] = useState('Decrypting...');
  const supabase = createClient();

  useEffect(() => {
    if (!isReady || !pm.messages?.content) {
      if (!pm.messages?.content) setDecryptedText(pm.messages?.type === 'image' ? 'Photo' : 'Attachment');
      return;
    }
    async function doDecrypt() {
      try {
        const text = await decrypt(pm.messages.content);
        setDecryptedText(text);
      } catch (e) {
        setDecryptedText('Encrypted Message');
      }
    }
    doDecrypt();
  }, [isReady, pm.messages]);

  return (
    <div className="p-3 bg-[#F9FAFB] dark:bg-[#11141A] rounded-xl relative group">
      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">{decryptedText}</p>
      <div className="flex justify-between items-center text-[10px] text-gray-500">
        <span>{new Date(pm.created_at).toLocaleDateString()}</span>
        <button 
          onClick={async () => {
            try {
              const { error } = await supabase.from('pinned_messages').delete().eq('id', pm.id);
              if (error) throw error;
              removePin(pm.id);
              toast.success('Unpinned message');
            } catch(e: any) {
              toast.error('Failed to unpin');
            }
          }}
          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Unpin
        </button>
      </div>
    </div>
  );
}
`;

if (!content.includes('function PinnedMessageItem')) {
  // Inject component
  content = content.replace(
    'function DecryptedMediaThumbnail',
    pinnedMessageItemComponent + '\nfunction DecryptedMediaThumbnail'
  );
  
  // Replace old pinned render loop with the new component mapping
  const regex = /\{activeTab === 'pinned' && \([\s\S]*?pinnedMessages\.length > 0 \? \([\s\S]*?<div className="space-y-3">[\s\S]*?\{pinnedMessages\.map\(pm => \([\s\S]*?<div key=\{pm\.id\}[\s\S]*?<\/div>\s*\)\)\}\s*<\/div>\s*\) : \(\s*<div className="text-center py-6"><p className="text-xs text-gray-600">No pinned messages<\/p><\/div>\s*\)\s*\)\}/;
  content = content.replace(regex, updatedPinnedRender.trim());
  
  fs.writeFileSync('src/components/chat/ProfilePanel.tsx', content);
  console.log('Pinned tab decryption added!');
}
