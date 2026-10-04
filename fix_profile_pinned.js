const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

if (!content.includes('pinnedMessages')) {
  // Add state for pinned tab
  content = content.replace("const [activeTab, setActiveTab] = useState<'media' | 'files'>('media');", "const [activeTab, setActiveTab] = useState<'media' | 'files' | 'pinned'>('media');\n  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);");

  // Load pinned messages
  const loadMediaFunction = `async function loadMedia() {`;
  const loadPinnedData = `
    const { data: pData } = await supabase.from('pinned_messages').select('*, messages(*)').eq('conversation_id', conversation.id).order('created_at', { ascending: false });
    if (pData) setPinnedMessages(pData);
  `;
  content = content.replace(loadMediaFunction, loadMediaFunction + loadPinnedData);

  // Update tabs map
  content = content.replace("(['media', 'files'] as const).map", "(['media', 'files', 'pinned'] as const).map");

  // Render pinned tab
  const pinnedTab = `
              {activeTab === 'pinned' && (
                pinnedMessages.length > 0 ? (
                  <div className="space-y-2">
                    {pinnedMessages.map(p => (
                      <div key={p.id} className="relative p-3 rounded-xl bg-[#F9FAFB] dark:bg-[#11141A] text-sm">
                        <button onClick={async () => {
                          await supabase.from('pinned_messages').delete().eq('id', p.id);
                          setPinnedMessages(prev => prev.filter(x => x.id !== p.id));
                        }} className="absolute top-2 right-2 text-red-500 hover:text-red-600"><X size={14}/></button>
                        <p className="text-gray-900 dark:text-gray-100 pr-6">{p.messages?.content || (p.messages?.attachments ? '[Media/Attachment]' : 'Pinned Message')}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{new Date(p.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6"><p className="text-xs text-gray-600">No pinned messages</p></div>
                )
              )}
  `;
  
  content = content.replace(/(\s*)({\s*activeTab === 'files' && \([\s\S]*?\}\s*\)\s*})/, '$1$2$1' + pinnedTab);
  
  fs.writeFileSync('src/components/chat/ProfilePanel.tsx', content);
}
