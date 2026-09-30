'use client';


import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Profile, Friendship } from '@/types';
import { cn, debounce } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, UserPlus, Users, Loader2, MessageSquare, Check, X as XIcon, Clock } from 'lucide-react';
import { useFriendActions } from '@/hooks/useFriendActions';

type TabType = 'friends' | 'find';

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  
  // Find People State
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [relationshipMap, setRelationshipMap] = useState<Record<string, string>>({});
  const [requestIds, setRequestIds] = useState<Record<string, string>>({});
  
  // Friends State
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMoreFriends, setHasMoreFriends] = useState(false);
  
  // Requests State
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const { sendFriendRequest, respondToRequest, cancelRequest } = useFriendActions();

  const fetchFriendsAndRequests = useCallback(async () => {
    if (!profile) return;
    
    // Fetch Friendships
    const { data: friendsData } = await supabase
      .from('friendships')
      .select('id, created_at, user_id, friend_id, friend:profiles!friendships_friend_id_fkey(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(page * 20);

    const { data: friendsData2 } = await supabase
      .from('friendships')
      .select('id, created_at, user_id, friend_id, friend:profiles!friendships_user_id_fkey(*)')
      .eq('friend_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(page * 20);

    const validFriends: Friendship[] = [];
    if (friendsData) {
      friendsData.forEach((f: any) => {
        if (f.friend) validFriends.push({ ...f, friend: f.friend as Profile });
      });
    }
    if (friendsData2) {
      friendsData2.forEach((f: any) => {
        if (f.friend && f.friend.id !== profile.id && !validFriends.find(vf => vf.friend?.id === f.friend.id)) {
          validFriends.push({ ...f, friend: f.friend as Profile });
        }
      });
    }
    setFriendships(validFriends);
    setLoadingFriends(false);

    // Use raw select without foreign keys if we only need raw data, to avoid PostgREST FKEY ambiguity issues
    const { data: incReq } = await supabase
      .from('friend_requests')
      .select('*, sender:profiles!friend_requests_sender_id_fkey(*)')
      .eq('receiver_id', profile.id)
      .eq('status', 'pending');
    setIncomingRequests(incReq || []);

    const { data: outReq } = await supabase
      .from('friend_requests')
      .select('*, receiver:profiles!friend_requests_receiver_id_fkey(*)')
      .eq('sender_id', profile.id)
      .eq('status', 'pending');
    setOutgoingRequests(outReq || []);
    
    setLoadingRequests(false);
  }, [profile, supabase, page]);

  useEffect(() => {
    fetchFriendsAndRequests();
  }, [fetchFriendsAndRequests]);

  // Real-time synchronization
  useEffect(() => {
    if (!profile) return;
    
    const channel = supabase.channel('contacts_realtime_' + profile.id + '_' + Math.random().toString(36).substring(7))
      .on('postgres_changes', { 
        event: '*', schema: 'public', table: 'friend_requests' 
      }, () => {
        fetchFriendsAndRequests();
      })
      .on('postgres_changes', { 
        event: '*', schema: 'public', table: 'friendships' 
      }, () => {
        fetchFriendsAndRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, supabase, fetchFriendsAndRequests]);

  const search = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || !profile) { setSearchResults([]); return; }
      setIsSearching(true);
      try {
        const normalized = q.toLowerCase();
        const { data: users } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', profile.id)
          .or(`username_normalized.ilike.%${normalized}%,display_name.ilike.%${q}%`)
          .limit(20);
          
        const fetchedUsers = users || [];
        setSearchResults(fetchedUsers);
        
        if (fetchedUsers.length > 0) {
          const userIds = fetchedUsers.map(u => u.id);
          const uids = userIds.join(',');
          
          const { data: fData } = await supabase
            .from('friendships')
            .select('user_id, friend_id')
            .or(`and(user_id.eq.${profile.id},friend_id.in.(${uids})),and(friend_id.eq.${profile.id},user_id.in.(${uids}))`);
            
          const { data: rData } = await supabase
            .from('friend_requests')
            .select('id, sender_id, receiver_id, status')
            .eq('status', 'pending')
            .or(`and(sender_id.eq.${profile.id},receiver_id.in.(${uids})),and(receiver_id.eq.${profile.id},sender_id.in.(${uids}))`);
            
          const newMap: Record<string, string> = {};
          const newReqIds: Record<string, string> = {};
          
          fetchedUsers.forEach(u => {
            const isFriend = fData?.some(f => (f.user_id === profile.id && f.friend_id === u.id) || (f.friend_id === profile.id && f.user_id === u.id));
            if (isFriend) {
              newMap[u.id] = 'friend';
              return;
            }
            const req = rData?.find(r => (r.sender_id === profile.id && r.receiver_id === u.id) || (r.receiver_id === profile.id && r.sender_id === u.id));
            if (req) {
              newReqIds[u.id] = req.id;
              if (req.sender_id === profile.id) newMap[u.id] = 'outgoing_request';
              else newMap[u.id] = 'incoming_request';
            } else {
              newMap[u.id] = 'none';
            }
          });
          
          setRelationshipMap(newMap);
          setRequestIds(newReqIds);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [profile, supabase]
  );

  // Trigger search when query changes OR when we switch to find tab
  useEffect(() => {
    if (activeTab === 'find') {
      search(query);
    }
  }, [query, activeTab, search]);
  
  // Ensure the search re-runs when a request is updated and we are on the find tab
  useEffect(() => {
    if (activeTab === 'find' && query.trim()) {
      search(query);
    }
  }, [incomingRequests, outgoingRequests, friendships]); // these change on realtime events

  async function handleStartChat(targetProfile: Profile) {
    if (!profile || isStartingChat) return;
    setIsStartingChat(targetProfile.id);
    try {
      const { data: existingMembers } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', profile.id);

      if (existingMembers && existingMembers.length > 0) {
        const convIds = existingMembers.map(m => m.conversation_id);
        const { data: shared } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('user_id', targetProfile.id);

        if (shared && shared.length > 0) {
          router.push(`/chat/${shared[0].conversation_id}`);
          return;
        }
      }

      const { data: newConvId, error: convErr } = await supabase.rpc('start_direct_conversation', { other_user_id: targetProfile.id });
        if (convErr) throw convErr;
        router.push(`/chat/${newConvId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start conversation');
    } finally {
      setIsStartingChat(null);
    }
  }

  const getRelationshipStatus = (targetId: string) => {
    return relationshipMap[targetId] || 'none';
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[#0B0F19]">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">Friends</h1>

        {/* Premium Segmented Control for Tabs */}
        <div className="flex mb-8">
          <div className="inline-flex items-center p-1.5 bg-gray-200/50 dark:bg-[#111827] rounded-[12px] border border-gray-200/50 dark:border-[#1F2937]">
            <button
              onClick={() => setActiveTab('friends')}
              className={cn(
                "px-6 py-2.5 rounded-[8px] text-sm font-bold transition-all duration-300",
                activeTab === 'friends' ? "bg-white dark:bg-[#1F2937] text-gray-900 dark:text-white shadow-sm" : "text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA]"
              )}
            >
              My Friends
            </button>
            <button
              onClick={() => setActiveTab('find')}
              className={cn(
                "px-6 py-2.5 rounded-[8px] text-sm font-bold transition-all duration-300",
                activeTab === 'find' ? "bg-white dark:bg-[#1F2937] text-gray-900 dark:text-white shadow-sm" : "text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA]"
              )}
            >
              Find People
            </button>
          </div>
        </div>

        {activeTab === 'find' && (
          <div className="animate-fade-in">
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
              <input
                type="text"
                value={query}
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search username, e.g. @rahul123"
                className="w-full bg-white dark:bg-[#111827] border border-gray-100 dark:border-[#1F2937] rounded-[12px] py-4 pl-12 pr-12 text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 shadow-sm transition-all"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              )}
            </div>

            {query.trim() !== '' && (
              <div className="space-y-4">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="text-center py-16 bg-white dark:bg-[#111827] rounded-[12px] border border-dashed border-gray-200 dark:border-[#1F2937] shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-4">
                       <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No user found with that username.</p>
                  </div>
                ) : (
                  searchResults.map(user => {
                    const status = getRelationshipStatus(user.id);
                    return (
                      <div key={user.id} className="w-full flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-[#111827] rounded-[12px] border border-gray-100 dark:border-[#1F2937] hover:border-pink-500/30 hover:shadow-xl hover:shadow-pink-500/5 hover:-translate-y-1 transition-all duration-300 gap-4">
                        <div 
                          className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                          onClick={() => router.push(`/profile/${user.username || user.id}`)}
                        >
                          <UserAvatar src={user.avatar_url} name={user.display_name} size="lg" isOnline={user.is_online} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white text-lg truncate">
                              {user.display_name}
                            </p>
                            <p className="text-sm font-medium text-pink-500 truncate">@{user.username}</p>
                            {user.bio && <p className="text-sm text-gray-500 mt-1.5 truncate">{user.bio}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {status === 'none' && (
                            <button
                              onClick={async () => {
                                // Optimistically update UI
                                setRelationshipMap(prev => ({...prev, [user.id]: 'outgoing_request'}));
                                const result: any = await sendFriendRequest(user.id);
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
                              className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-[8px] text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 w-full md:w-auto"
                            >
                              <UserPlus className="w-4 h-4" /> Add Friend
                            </button>
                          )}
                          {status === 'outgoing_request' && (
                            <button
                              disabled
                              className="px-5 py-2.5 bg-gray-100 dark:bg-[#1F2937] text-gray-400 rounded-[8px] text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed w-full md:w-auto"
                            >
                              <Clock className="w-4 h-4" /> Request Sent
                            </button>
                          )}
                          {status === 'incoming_request' && (
                            <button
                              onClick={async () => {
                                // Optimistically update UI
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
                              className="px-5 py-2.5 bg-green-500 text-white rounded-[8px] text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-green-500/25 w-full md:w-auto"
                            >
                              <Check className="w-4 h-4" /> Accept
                            </button>
                          )}
                          {status === 'friend' && (
                            <button
                              onClick={() => handleStartChat(user)}
                              disabled={isStartingChat === user.id}
                              className="px-5 py-2.5 gradient-bg text-white rounded-[8px] text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-pink-500/25 w-full md:w-auto"
                            >
                              {isStartingChat === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
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
               <div className="text-center py-20">
                  <div className="w-20 h-20 bg-white dark:bg-[#111827] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-[#1F2937]">
                     <Search className="w-10 h-10 text-pink-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Find your friends</h3>
                  <p className="text-gray-500 font-medium">Search using their exact @username</p>
               </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="animate-fade-in space-y-10">
            
            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Friend Requests
                </h3>
                <div className="grid gap-4">
                  {incomingRequests.map(req => (
                    <div key={req.id} className="w-full flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-[#111827] rounded-[12px] border border-gray-100 dark:border-[#1F2937] hover:border-pink-500/30 hover:shadow-xl hover:shadow-pink-500/5 hover:-translate-y-1 transition-all duration-300 gap-4">
                      <div 
                        className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                        onClick={() => router.push(`/profile/${req.sender?.username || req.sender_id}`)}
                      >
                        <UserAvatar src={req.sender?.avatar_url} name={req.sender?.display_name || 'User'} size="lg" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white text-lg truncate">{req.sender?.display_name || 'User'}</p>
                          <p className="text-sm font-medium text-pink-500 truncate">@{req.sender?.username || 'unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                          onClick={async () => {
                            await respondToRequest(req.id, req.sender_id, 'accepted');
                            fetchFriendsAndRequests();
                          }}
                          className="flex-1 md:flex-none px-6 py-2.5 bg-green-500 text-white rounded-[8px] font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Accept
                        </button>
                        <button
                          onClick={async () => {
                            await respondToRequest(req.id, req.sender_id, 'declined');
                            fetchFriendsAndRequests();
                          }}
                          className="px-4 py-2.5 bg-gray-100 dark:bg-[#1F2937] text-gray-600 dark:text-gray-300 rounded-[8px] font-bold hover:bg-gray-200 dark:hover:bg-[#374151] transition-all flex items-center justify-center"
                        >
                          <XIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> My Friends {friendships.length > 0 && <span className="bg-gray-200 dark:bg-[#1F2937] text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">{friendships.length}</span>}
              </h3>
              
              {loadingFriends ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                </div>
              ) : friendships.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#111827] rounded-[12px] border border-dashed border-gray-200 dark:border-[#1F2937] shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-4">
                     <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No friends yet</h3>
                  <p className="text-gray-500 font-medium mb-6">Start connecting with people to see them here.</p>
                  <button
                    onClick={() => setActiveTab('find')}
                    className="px-6 py-2.5 gradient-bg text-white font-bold rounded-[8px] hover:opacity-90 transition-all shadow-lg shadow-pink-500/25"
                  >
                    Find friends
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {friendships.map(f => {
                    if (!f.friend) return null;
                    return (
                      <div key={f.id} className="w-full flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-[#111827] rounded-[12px] border border-gray-100 dark:border-[#1F2937] hover:border-pink-500/30 hover:shadow-xl hover:shadow-pink-500/5 hover:-translate-y-1 transition-all duration-300 gap-4">
                        <div 
                          className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                          onClick={() => router.push(`/profile/${f.friend?.username || f.friend?.id}`)}
                        >
                          <UserAvatar src={f.friend.avatar_url} name={f.friend.display_name} size="lg" isOnline={f.friend.is_online} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white text-lg truncate">{f.friend.display_name}</p>
                            <p className="text-sm font-medium text-pink-500 truncate">@{f.friend.username}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartChat(f.friend!)}
                          disabled={isStartingChat === f.friend.id}
                          className="flex-1 md:flex-none px-6 py-2.5 gradient-bg text-white rounded-[8px] text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-500/25 w-full md:w-auto"
                        >
                          {isStartingChat === f.friend.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
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
