const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

const pinnedTabRender = `
              {activeTab === 'pinned' && (
                pinnedMessages.length > 0 ? (
                  <div className="space-y-3">
                    {pinnedMessages.map(pm => (
                      <div key={pm.id} className="p-3 bg-[#F9FAFB] dark:bg-[#11141A] rounded-xl relative group">
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">{pm.messages?.content || 'Message'}</p>
                        <div className="flex justify-between items-center text-[10px] text-gray-500">
                          <span>{new Date(pm.created_at).toLocaleDateString()}</span>
                          <button 
                            onClick={async () => {
                              try {
                                const { error } = await supabase.from('pinned_messages').delete().eq('id', pm.id);
                                if (error) throw error;
                                setPinnedMessages(prev => prev.filter(p => p.id !== pm.id));
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6"><p className="text-xs text-gray-600">No pinned messages</p></div>
                )
              )}
`;

content = content.replace(
  /\{\!isDirect && conversation\.members && \(/,
  pinnedTabRender.trim() + '\n              {!isDirect && conversation.members && ('
);

fs.writeFileSync('src/components/chat/ProfilePanel.tsx', content);
