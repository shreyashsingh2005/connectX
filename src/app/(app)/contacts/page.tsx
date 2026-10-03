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
    
    const channel = supabase.channel(`contacts_realtime:${profile.id}`)
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
                          onClick={() => router.push(`/profile/${user.username || user.id}`)}
                        >
                          <UserAvatar src={user.avatar_url} name={user.display_name} size="xl" isOnline={user.is_online} />
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
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-2 bg-[#F8FAFC] dark:bg-[#151922] text-[#98A2B3] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] text-[13px] font-medium flex items-center justify-center gap-2 min-w-[90px]">
                                <Clock className="w-[14px] h-[14px]" /> Pending
                              </span>
                              <button
                                onClick={async () => {
                                  const reqId = requestIds[user.id];
                                  if (reqId) {
                                    setRelationshipMap(prev => ({...prev, [user.id]: 'none'}));
                                    await cancelRequest(reqId);
                                    fetchFriendsAndRequests();
                                  }
                                }}
                                className="px-3 py-2 bg-[#FEF3F2] dark:bg-[#F04438]/10 text-[#F04438] hover:bg-[#FEE4E2] dark:hover:bg-[#F04438]/20 rounded-[10px] text-[13px] font-medium transition-all flex items-center justify-center"
                              >
                                Cancel
                              </button>
                            </div>
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
                        onClick={() => router.push(`/profile/${req.sender?.username || req.sender_id}`)}
                      >
                        <UserAvatar src={req.sender?.avatar_url} name={req.sender?.display_name || 'User'} size="xl" />
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

            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] flex items-center gap-2 px-1">
                  <Clock className="w-[18px] h-[18px] text-[#8B5CF6]" /> 
                  Sent Requests
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outgoingRequests.map(req => (
                    <div key={req.id} className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] hover:shadow-md transition-all duration-150 gap-4">
                      <div 
                        className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                        onClick={() => router.push(`/profile/${req.receiver?.username || req.receiver_id}`)}
                      >
                        <UserAvatar src={req.receiver?.avatar_url} name={req.receiver?.display_name || 'User'} size="xl" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#101828] dark:text-[#F5F7FA] text-[15px] truncate">{req.receiver?.display_name || 'User'}</p>
                          <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] truncate">@{req.receiver?.username || 'unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            await cancelRequest(req.id);
                            fetchFriendsAndRequests();
                          }}
                          className="px-3 py-2 bg-[#FEF3F2] dark:bg-[#F04438]/10 text-[#F04438] hover:bg-[#FEE4E2] dark:hover:bg-[#F04438]/20 rounded-[10px] text-[13px] font-medium transition-all flex items-center justify-center"
                        >
                          Cancel
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
                          onClick={() => router.push(`/profile/${f.friend?.username || f.friend?.id}`)}
                        >
                          <div className="relative">
                            <UserAvatar src={f.friend.avatar_url} name={f.friend.display_name} size="xl" />
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
                          onClick={() => handleStartChat(f.friend!)}
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
