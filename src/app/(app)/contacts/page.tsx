'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Profile, Friendship } from '@/types';
import { cn, debounce } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, Loader2, MessageSquare, Check, X as XIcon, Clock, UserPlus, Users } from 'lucide-react';
import { useFriendActions } from '@/hooks/useFriendActions';

type TabType = 'requests' | 'friends';

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  
  // Search State
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Maps to quickly check relationship status
  const [relationshipMap, setRelationshipMap] = useState<Record<string, string>>({});
  const [requestIds, setRequestIds] = useState<Record<string, string>>({});
  
  // Data State
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const { sendFriendRequest, respondToRequest, cancelRequest } = useFriendActions();

  const fetchAllData = useCallback(async () => {
    if (!profile) return;
    
    // Fetch Friendships
    const { data: friendsData } = await supabase
      .from('friendships')
      .select('id, created_at, user_id, friend_id, friend:profiles!friendships_friend_id_fkey(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    const { data: friendsData2 } = await supabase
      .from('friendships')
      .select('id, created_at, user_id, friend_id, friend:profiles!friendships_user_id_fkey(*)')
      .eq('friend_id', profile.id)
      .order('created_at', { ascending: false });

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

    // Fetch Requests
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

    // Fetch Suggestions (random users not friends/requested)
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', profile.id)
      .limit(50);
      
    if (allUsers) {
      const friendIds = new Set(validFriends.map(f => f.friend?.id));
      const incReqIds = new Set((incReq || []).map(r => r.sender_id));
      const outReqIds = new Set((outReq || []).map(r => r.receiver_id));
      
      const possibleSuggestions = allUsers.filter(u => 
        !friendIds.has(u.id) && 
        !incReqIds.has(u.id) && 
        !outReqIds.has(u.id)
      );
      
      setSuggestions(possibleSuggestions.slice(0, 5));
    }
    
    setIsLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Real-time synchronization
  useEffect(() => {
    if (!profile) return;
    const channel = supabase.channel(`contacts_realtime:${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => fetchAllData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, supabase, fetchAllData]);

  const performSearch = useCallback(
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

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  useEffect(() => {
    if (query.trim()) performSearch(query);
  }, [incomingRequests, outgoingRequests, friendships, query, performSearch]);

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
          .eq('user_id', targetProfile.id)
          .in('conversation_id', convIds);

        if (shared && shared.length > 0) {
          const { data: convData } = await supabase
            .from('conversations')
            .select('type')
            .eq('id', shared[0].conversation_id)
            .single();

          if (convData?.type === 'direct') {
            router.push(`/chat/${shared[0].conversation_id}`);
            return;
          }
        }
      }

      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert([{ type: 'direct' }])
        .select()
        .single();

      if (convError || !newConv) throw convError;

      await supabase.from('conversation_members').insert([
        { conversation_id: newConv.id, user_id: profile.id, role: 'member' },
        { conversation_id: newConv.id, user_id: targetProfile.id, role: 'member' }
      ]);

      router.push(`/chat/${newConv.id}`);
    } catch (error) {
      toast.error('Could not start conversation');
      setIsStartingChat(null);
    }
  }

  const renderProfileCard = (p: Profile, context: 'search' | 'suggestion') => {
    const status = relationshipMap[p.id] || 'none';
    const reqId = requestIds[p.id];

    return (
      <div key={p.id} className="w-full flex flex-col p-4 bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] hover:border-[#8B5CF6]/30 hover:shadow-md transition-all duration-150 gap-4">
        <div 
          className="flex items-center gap-3 cursor-pointer min-w-0"
          onClick={() => router.push(`/profile/${p.username || p.id}`)}
        >
          <UserAvatar src={p.avatar_url} name={p.display_name} size="lg" className="w-[44px] h-[44px]" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#101828] dark:text-[#F5F7FA] text-[15px] truncate">{p.display_name}</p>
            <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] truncate">@{p.username}</p>
          </div>
        </div>

        <div className="flex items-center justify-end w-full">
          {status === 'friend' ? (
            <button
              onClick={() => handleStartChat(p)}
              className="w-full py-2 bg-[#F8FAFC] dark:bg-[#151922] text-[#101828] dark:text-[#F5F7FA] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] text-[13px] font-medium hover:bg-[#EAECF0] dark:hover:bg-[#252A34] transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-[#8B5CF6]" />
              Message
            </button>
          ) : status === 'outgoing_request' ? (
            <button
              onClick={async () => {
                if(reqId) await cancelRequest(reqId);
                fetchAllData();
                if (context === 'search') performSearch(query);
              }}
              className="w-full py-2 bg-[#FEF3F2] dark:bg-[#F04438]/10 text-[#F04438] hover:bg-[#FEE4E2] dark:hover:bg-[#F04438]/20 rounded-[10px] text-[13px] font-medium transition-all"
            >
              Cancel Request
            </button>
          ) : status === 'incoming_request' ? (
            <div className="flex w-full gap-2">
              <button
                onClick={async () => {
                  if(reqId) await respondToRequest(reqId, p.id, 'accepted');
                  fetchAllData();
                  if (context === 'search') performSearch(query);
                }}
                className="flex-1 py-2 bg-[#8B5CF6] text-white rounded-[10px] text-[13px] font-medium hover:bg-[#7C3AED] transition-all"
              >
                Accept
              </button>
              <button
                onClick={async () => {
                  if(reqId) await respondToRequest(reqId, p.id, 'declined');
                  fetchAllData();
                  if (context === 'search') performSearch(query);
                }}
                className="flex-1 py-2 bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#667085] dark:text-[#98A2B3] rounded-[10px] text-[13px] font-medium hover:bg-[#EAECF0] dark:hover:bg-[#252A34] transition-all"
              >
                Decline
              </button>
            </div>
          ) : (
            <button
              onClick={async () => {
                await sendFriendRequest(p.id);
                fetchAllData();
                if (context === 'search') performSearch(query);
                else {
                  setRelationshipMap(prev => ({...prev, [p.id]: 'outgoing_request'}));
                }
              }}
              className="w-full py-2 bg-[#8B5CF6] text-white rounded-[10px] text-[13px] font-medium hover:bg-[#7C3AED] transition-all shadow-sm"
            >
              Add Friend
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 z-10 overflow-hidden relative bg-[#F8FAFC] dark:bg-[#0B0D12]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[600px] mx-auto px-4 md:px-8 py-6 md:py-10">
          
          <h1 className="text-[24px] md:text-[28px] font-bold text-[#101828] dark:text-[#F5F7FA] tracking-tight mb-6">Friends</h1>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#FFFFFF] dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] rounded-[16px] h-[52px] pl-11 pr-4 text-[15px] text-[#101828] dark:text-[#F5F7FA] placeholder-[#98A2B3] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] shadow-sm transition-all"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-[#98A2B3] animate-spin" />
              </div>
            )}
          </div>

          {query.trim() ? (
            <div className="space-y-4 pb-10">
              <h2 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-2 px-1">Search Results</h2>
              {searchResults.length === 0 && !isSearching ? (
                <div className="text-center py-12">
                  <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">No users found for "{query}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.map(p => renderProfileCard(p, 'search'))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 pb-10">
              {/* Segmented Control */}
              <div className="flex p-1 bg-[#EAECF0]/60 dark:bg-[#11141A] rounded-[14px]">
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={cn(
                    "flex-1 py-2.5 text-[14px] font-semibold rounded-[10px] transition-all flex items-center justify-center gap-2",
                    activeTab === 'requests' 
                      ? "bg-[#FFFFFF] dark:bg-[#1A1E29] text-[#101828] dark:text-[#F5F7FA] shadow-sm" 
                      : "text-[#667085] dark:text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA]"
                  )}
                >
                  Requests
                  {incomingRequests.length > 0 && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[12px] font-bold",
                      activeTab === 'requests' ? "bg-[#8B5CF6]/10 text-[#8B5CF6]" : "bg-[#EAECF0] dark:bg-[#252A34] text-[#667085] dark:text-[#98A2B3]"
                    )}>
                      {incomingRequests.length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('friends')}
                  className={cn(
                    "flex-1 py-2.5 text-[14px] font-semibold rounded-[10px] transition-all flex items-center justify-center gap-2",
                    activeTab === 'friends' 
                      ? "bg-[#FFFFFF] dark:bg-[#1A1E29] text-[#101828] dark:text-[#F5F7FA] shadow-sm" 
                      : "text-[#667085] dark:text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA]"
                  )}
                >
                  Friends
                  {friendships.length > 0 && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[12px] font-bold",
                      activeTab === 'friends' ? "bg-[#8B5CF6]/10 text-[#8B5CF6]" : "bg-[#EAECF0] dark:bg-[#252A34] text-[#667085] dark:text-[#98A2B3]"
                    )}>
                      {friendships.length}
                    </span>
                  )}
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6]" /></div>
              ) : activeTab === 'requests' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Incoming Requests */}
                  {incomingRequests.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] px-1">Friend Requests</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {incomingRequests.map(req => (
                          <div key={req.id} className="w-full flex flex-col p-4 bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] hover:shadow-md transition-all duration-150 gap-4">
                            <div 
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                              onClick={() => router.push(`/profile/${req.sender?.username || req.sender_id}`)}
                            >
                              <UserAvatar src={req.sender?.avatar_url} name={req.sender?.display_name || 'User'} size="lg" className="w-[44px] h-[44px]" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#101828] dark:text-[#F5F7FA] text-[15px] truncate">{req.sender?.display_name || 'User'}</p>
                                <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] truncate">@{req.sender?.username || 'unknown'}</p>
                              </div>
                            </div>
                            <div className="flex w-full gap-2">
                              <button
                                onClick={async () => {
                                  await respondToRequest(req.id, req.sender_id, 'accepted');
                                  fetchAllData();
                                }}
                                className="flex-1 py-2 bg-[#8B5CF6] text-white rounded-[10px] text-[13px] font-medium hover:bg-[#7C3AED] transition-all shadow-sm"
                              >
                                Accept
                              </button>
                              <button
                                onClick={async () => {
                                  await respondToRequest(req.id, req.sender_id, 'declined');
                                  fetchAllData();
                                }}
                                className="flex-1 py-2 bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#667085] dark:text-[#98A2B3] rounded-[10px] text-[13px] font-medium hover:bg-[#EAECF0] dark:hover:bg-[#252A34] transition-all"
                              >
                                Decline
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
                      <h2 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] px-1 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#8B5CF6]" /> Sent Requests
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {outgoingRequests.map(req => (
                          <div key={req.id} className="w-full flex flex-col p-4 bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] hover:shadow-md transition-all duration-150 gap-4">
                            <div 
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                              onClick={() => router.push(`/profile/${req.receiver?.username || req.receiver_id}`)}
                            >
                              <UserAvatar src={req.receiver?.avatar_url} name={req.receiver?.display_name || 'User'} size="lg" className="w-[44px] h-[44px]" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#101828] dark:text-[#F5F7FA] text-[15px] truncate">{req.receiver?.display_name || 'User'}</p>
                                <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] truncate">@{req.receiver?.username || 'unknown'}</p>
                              </div>
                            </div>
                            <div className="flex w-full">
                              <button
                                onClick={async () => {
                                  await cancelRequest(req.id);
                                  fetchAllData();
                                }}
                                className="w-full py-2 bg-[#FEF3F2] dark:bg-[#F04438]/10 text-[#F04438] hover:bg-[#FEE4E2] dark:hover:bg-[#F04438]/20 rounded-[10px] text-[13px] font-medium transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-[14px] font-semibold text-[#101828] dark:text-[#F5F7FA] px-1">People you may know</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {suggestions.map(p => renderProfileCard(p, 'suggestion'))}
                      </div>
                    </div>
                  )}
                  
                  {incomingRequests.length === 0 && outgoingRequests.length === 0 && suggestions.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 bg-white dark:bg-[#11141A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#EAECF0] dark:border-[#252A34]">
                        <UserPlus className="w-5 h-5 text-[#98A2B3]" />
                      </div>
                      <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">No pending requests</h3>
                      <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">Use the search bar above to find people.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {friendships.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 bg-white dark:bg-[#11141A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#EAECF0] dark:border-[#252A34]">
                        <Users className="w-5 h-5 text-[#98A2B3]" />
                      </div>
                      <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">No friends yet</h3>
                      <p className="text-[14px] text-[#667085] dark:text-[#98A2B3] mb-6">Search for people by their unique @username and start connecting.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {friendships.map(f => {
                        if (!f.friend) return null;
                        return (
                          <div key={f.id} className="w-full flex flex-col p-4 bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] hover:shadow-md hover:border-[#8B5CF6]/30 transition-all duration-150 gap-4">
                            <div 
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                              onClick={() => router.push(`/profile/${f.friend?.username || f.friend?.id}`)}
                            >
                              <div className="relative">
                                <UserAvatar src={f.friend.avatar_url} name={f.friend.display_name} size="lg" className="w-[44px] h-[44px]" />
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
                              className="w-full py-2 bg-[#F8FAFC] dark:bg-[#151922] text-[#101828] dark:text-[#F5F7FA] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#EAECF0] dark:hover:bg-[#252A34] transition-all shadow-sm"
                            >
                              {isStartingChat === f.friend.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4 text-[#8B5CF6]" />}
                              Message
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
