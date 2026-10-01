const fs = require('fs');

const filePath = 'src/app/(app)/contacts/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const splitMarker = `  const getRelationshipStatus = (targetId: string) => {
    return relationshipMap[targetId] || 'none';
  };`;

const parts = code.split(splitMarker);
if (parts.length !== 2) {
  console.error("Could not find split marker!");
  process.exit(1);
}

const newReturn = `
  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#0B0D12]">
      <div className="max-w-[1120px] mx-auto px-4 md:px-8 py-8 md:py-12">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[26px] md:text-[30px] font-semibold text-[#101828] dark:text-[#F5F7FA] tracking-tight mb-1">Contacts</h1>
            <p className="text-[13px] md:text-[14px] text-[#667085] dark:text-[#98A2B3]">Manage your connections and discover people on connectX.</p>
          </div>
          <button
            onClick={() => setActiveTab('find')}
            className="px-5 py-2.5 bg-[#8B5CF6] text-white text-[14px] font-medium rounded-[10px] hover:bg-[#7C3AED] transition-all shadow-sm flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <UserPlus className="w-[18px] h-[18px]" />
            Add people
          </button>
        </div>

        {/* SEGMENTED CONTROL */}
        <div className="flex mb-8">
          <div className="inline-flex items-center p-1 bg-[#EAECF0]/50 dark:bg-[#11141A] rounded-[10px] border border-[#EAECF0] dark:border-[#252A34] w-full md:w-auto">
            <button
              onClick={() => setActiveTab('friends')}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 rounded-[8px] text-[14px] font-medium transition-all duration-150",
                activeTab === 'friends' ? "bg-white dark:bg-[#252A34] text-[#8B5CF6] dark:text-[#A78BFA] shadow-sm" : "text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA]"
              )}
            >
              My Friends
            </button>
            <button
              onClick={() => setActiveTab('find')}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 rounded-[8px] text-[14px] font-medium transition-all duration-150",
                activeTab === 'find' ? "bg-white dark:bg-[#252A34] text-[#8B5CF6] dark:text-[#A78BFA] shadow-sm" : "text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA]"
              )}
            >
              Find People
            </button>
          </div>
        </div>

        {/* FIND PEOPLE TAB */}
        {activeTab === 'find' && (
          <div className="animate-in fade-in duration-150">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">Find people</h2>
              <p className="text-[14px] text-[#667085] dark:text-[#98A2B3] mb-4">Search by unique @username to connect with someone.</p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#98A2B3]" />
                <input
                  type="text"
                  value={query}
                  autoFocus
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search people by @username"
                  className="w-full bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] rounded-[12px] py-3.5 pl-11 pr-11 text-[#101828] dark:text-[#F5F7FA] placeholder-[#98A2B3] text-[15px] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all shadow-sm h-[48px]"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-[#8B5CF6] animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {query.trim() !== '' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="col-span-full text-center py-12">
                    <div className="w-12 h-12 bg-white dark:bg-[#11141A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#EAECF0] dark:border-[#252A34]">
                       <Search className="w-6 h-6 text-[#98A2B3]" />
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">No people found</h3>
                    <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Try another @username.</p>
                  </div>
                ) : (
                  searchResults.map(user => {
                    const status = getRelationshipStatus(user.id);
                    return (
                      <div key={user.id} className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] hover:shadow-md hover:border-[#8B5CF6]/30 transition-all duration-150 gap-4">
                        <div 
                          className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                          onClick={() => router.push(\`/profile/\${user.username || user.id}\`)}
                        >
                          <UserAvatar src={user.avatar_url} name={user.display_name} size="lg" isOnline={user.is_online} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#101828] dark:text-[#F5F7FA] text-[15px] truncate">
                              {user.display_name}
                            </p>
                            <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] truncate">@{user.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {status === 'none' && (
                            <button
                              onClick={async () => {
                                setRelationshipMap(prev => ({...prev, [user.id]: 'outgoing_request'}));
                                const result = await sendFriendRequest(user.id);
                                if (result && result.state) {
                                  let state = result.state.toLowerCase();
                                  if (state === 'outgoing_pending') state = 'outgoing_request';
                                  if (state === 'incoming_pending') state = 'incoming_request';
                                  if (state === 'friends') state = 'friend';
                                  setRelationshipMap(prev => ({...prev, [user.id]: state}));
                                } else {
                                  setRelationshipMap(prev => ({...prev, [user.id]: 'none'}));
                                }
                                fetchFriendsAndRequests();
                              }}
                              className="px-4 py-2 bg-[#101828] dark:bg-[#F5F7FA] text-white dark:text-[#101828] hover:bg-[#1D2939] dark:hover:bg-white rounded-[10px] text-[13px] font-medium transition-all shadow-sm flex items-center justify-center gap-2 min-w-[110px]"
                            >
                              <UserPlus className="w-[16px] h-[16px]" /> Add Friend
                            </button>
                          )}
                          {status === 'outgoing_request' && (
                            <button
                              disabled
                              className="px-4 py-2 bg-[#F8FAFC] dark:bg-[#151922] text-[#98A2B3] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] text-[13px] font-medium flex items-center justify-center gap-2 cursor-not-allowed min-w-[110px]"
                            >
                              <Clock className="w-[16px] h-[16px]" /> Request Sent
                            </button>
                          )}
                          {status === 'incoming_request' && (
                            <button
                              onClick={async () => {
                                setRelationshipMap(prev => ({...prev, [user.id]: 'friend'}));
                                const reqId = requestIds[user.id];
                                if (reqId) {
                                  const ok = await respondToRequest(reqId, user.id, 'accepted');
                                  if (!ok) {
                                    setRelationshipMap(prev => ({...prev, [user.id]: 'incoming_request'}));
                                  }
                                }
                                fetchFriendsAndRequests();
                              }}
                              className="px-4 py-2 bg-[#12B76A] text-white rounded-[10px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#0E9F5D] transition-all shadow-sm min-w-[110px]"
                            >
                              <Check className="w-[16px] h-[16px]" /> Accept
                            </button>
                          )}
                          {status === 'friend' && (
                            <button
                              onClick={() => handleStartChat(user)}
                              disabled={isStartingChat === user.id}
                              className="px-4 py-2 bg-[#8B5CF6] text-white rounded-[10px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#7C3AED] transition-all shadow-sm min-w-[110px]"
                            >
                              {isStartingChat === user.id ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : <MessageSquare className="w-[16px] h-[16px]" />}
                              Message
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            
            {!query.trim() && (
               <div className="text-center py-16">
                  <div className="w-12 h-12 bg-white dark:bg-[#11141A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#EAECF0] dark:border-[#252A34]">
                     <Users className="w-[20px] h-[20px] text-[#98A2B3]" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">Find your friends</h3>
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Search using their exact @username</p>
               </div>
            )}
          </div>
        )}

        {/* MY FRIENDS TAB */}
        {activeTab === 'friends' && (
          <div className="animate-in fade-in duration-150 space-y-8">
            
            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] flex items-center gap-2 px-1">
                  <UserPlus className="w-[18px] h-[18px] text-[#8B5CF6]" /> 
                  Friend Requests
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomingRequests.map(req => (
                    <div key={req.id} className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] hover:shadow-md transition-all duration-150 gap-4">
                      <div 
                        className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                        onClick={() => router.push(\`/profile/\${req.sender?.username || req.sender_id}\`)}
                      >
                        <UserAvatar src={req.sender?.avatar_url} name={req.sender?.display_name || 'User'} size="lg" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#101828] dark:text-[#F5F7FA] text-[15px] truncate">{req.sender?.display_name || 'User'}</p>
                          <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] truncate">@{req.sender?.username || 'unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            await respondToRequest(req.id, req.sender_id, 'accepted');
                            fetchFriendsAndRequests();
                          }}
                          className="px-4 py-2 bg-[#12B76A] text-white rounded-[10px] text-[13px] font-medium hover:bg-[#0E9F5D] transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <Check className="w-[16px] h-[16px]" /> Accept
                        </button>
                        <button
                          onClick={async () => {
                            await respondToRequest(req.id, req.sender_id, 'declined');
                            fetchFriendsAndRequests();
                          }}
                          className="px-3 py-2 bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#667085] dark:text-[#98A2B3] rounded-[10px] text-[13px] font-medium hover:bg-[#EAECF0] dark:hover:bg-[#252A34] transition-all flex items-center justify-center"
                        >
                          <XIcon className="w-[16px] h-[16px]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className="space-y-4">
              <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] flex items-center gap-2 px-1">
                <Users className="w-[18px] h-[18px] text-[#8B5CF6]" /> 
                My Friends 
                {friendships.length > 0 && <span className="bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#667085] dark:text-[#98A2B3] px-2 py-0.5 rounded-[6px] text-[12px] font-medium ml-1">{friendships.length}</span>}
              </h3>
              
              {loadingFriends ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full skeleton" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-24 skeleton" />
                          <div className="h-3 w-16 skeleton" />
                        </div>
                      </div>
                      <div className="w-24 h-9 rounded-[10px] skeleton" />
                    </div>
                  ))}
                </div>
              ) : friendships.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 bg-white dark:bg-[#11141A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#EAECF0] dark:border-[#252A34]">
                     <Users className="w-[20px] h-[20px] text-[#98A2B3]" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">No friends yet</h3>
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3] mb-6">Find people by their unique @username and start connecting.</p>
                  <button
                    onClick={() => setActiveTab('find')}
                    className="px-5 py-2.5 bg-[#8B5CF6] text-white text-[14px] font-medium rounded-[10px] hover:bg-[#7C3AED] transition-all shadow-sm"
                  >
                    Find People
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friendships.map(f => {
                    if (!f.friend) return null;
                    return (
                      <div key={f.id} className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] hover:shadow-md hover:border-[#8B5CF6]/30 transition-all duration-150 gap-4">
                        <div 
                          className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                          onClick={() => router.push(\`/profile/\${f.friend?.username || f.friend?.id}\`)}
                        >
                          <div className="relative">
                            <UserAvatar src={f.friend.avatar_url} name={f.friend.display_name} size="lg" />
                            {f.friend.is_online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#12B76A] border-2 border-white dark:border-[#11141A] rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#101828] dark:text-[#F5F7FA] text-[15px] truncate">{f.friend.display_name}</p>
                            <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] truncate">@{f.friend.username}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartChat(f.friend)}
                          disabled={isStartingChat === f.friend.id}
                          className="px-4 py-2 bg-[#F8FAFC] dark:bg-[#151922] text-[#101828] dark:text-[#F5F7FA] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#EAECF0] dark:hover:bg-[#252A34] transition-all shadow-sm min-w-[110px]"
                        >
                          {isStartingChat === f.friend.id ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : <MessageSquare className="w-[16px] h-[16px] text-[#8B5CF6]" />}
                          Message
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
`;

const finalCode = parts[0] + splitMarker + newReturn;

fs.writeFileSync(filePath, finalCode, 'utf8');
console.log("Updated Contacts Page UI");
