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
  const [relationshipMap, setRelationshipMap] = useState<Record<string, 'friend' | 'incoming_request' | 'outgoing_request' | 'none'>>({});
  const [requestIds, setRequestIds] = useState<Record<string, string>>({});
  
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);

  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const router = useRouter();
  const { sendFriendRequest, respondToRequest, cancelRequest } = useFriendActions();

  const fetchAllData = useCallback(async () => {
    if (!profile) return;
    try {
      // 1. Fetch Friendships
      const { data: fData } = await supabase
        .from('friendships')
        .select(`*, friend:profiles!friendships_friend_id_fkey(*)`)
        .eq('user_id', profile.id);
        
      setFriendships(fData || []);
      
      const newMap: Record<string, any> = {};
      fData?.forEach(f => {
        newMap[f.friend_id] = 'friend';
      });

      // 2. Fetch Requests
      const { data: rData } = await supabase
        .from('friend_requests')
        .select(`*, sender:profiles!friend_requests_sender_id_fkey(*), receiver:profiles!friend_requests_receiver_id_fkey(*)`)
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .eq('status', 'pending');
        
      const incoming: any[] = [];
      const outgoing: any[] = [];
      const newReqIds: Record<string, string> = {};

      rData?.forEach(r => {
        if (r.receiver_id === profile.id) {
          incoming.push(r);
          newMap[r.sender_id] = 'incoming_request';
          newReqIds[r.sender_id] = r.id;
        } else {
          outgoing.push(r);
          newMap[r.receiver_id] = 'outgoing_request';
          newReqIds[r.receiver_id] = r.id;
        }
      });

      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setRelationshipMap(newMap);
      setRequestIds(newReqIds);

      // 3. Suggestions
      if (!query) {
        const excludeIds = [profile.id, ...Object.keys(newMap)];
        let queryBuilder = supabase.from('profiles').select('*').limit(5);
        if (excludeIds.length > 0) {
           queryBuilder = queryBuilder.not('id', 'in', `(${excludeIds.join(',')})`);
        }
        const { data: sData } = await queryBuilder;
        setSuggestions(sData || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [profile, supabase, query]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle Realtime updates
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('contacts_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
        fetchAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        fetchAllData();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [profile, supabase, fetchAllData]);

  const performSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || !profile) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const searchTerm = q.toLowerCase();
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', profile.id)
          .or(`username_normalized.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
          .limit(20);
          
        setSearchResults(data || []);
        
        if (data && data.length > 0) {
          const userIds = data.map(u => u.id);
          const { data: friendships } = await supabase
            .from('friendships')
            .select('friend_id')
            .eq('user_id', profile.id)
            .in('friend_id', userIds);
            
          const { data: requests } = await supabase
            .from('friend_requests')
            .select('*')
            .in('sender_id', [profile.id, ...userIds])
            .in('receiver_id', [profile.id, ...userIds])
            .eq('status', 'pending');
            
          const newMap = { ...relationshipMap };
          const newReqIds = { ...requestIds };
          
          data.forEach(u => {
            if (friendships?.some(f => f.friend_id === u.id)) {
              newMap[u.id] = 'friend';
              return;
            }
            const req = requests?.find(r => (r.sender_id === profile.id && r.receiver_id === u.id) || (r.receiver_id === profile.id && r.sender_id === u.id));
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
    [profile, supabase, relationshipMap, requestIds]
  );

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  async function handleStartChat(targetProfile: Profile) {
    if (!profile || isStartingChat) return;
    setIsStartingChat(targetProfile.id);
    try {
      const { data: convId, error } = await supabase.rpc('start_direct_conversation', { 
        other_user_id: targetProfile.id 
      });
      
      if (error) throw error;
      if (!convId) throw new Error('No conversation ID returned');
      
      router.push(`/chat/${convId}`);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      toast.error('Could not start conversation');
    } finally {
      setIsStartingChat(null);
    }
  }

  // --- REUSABLE COMPACT ROW COMPONENT ---
  const CompactUserRow = ({ 
    user, 
    context, 
    reqId 
  }: { 
    user: Profile; 
    context: 'friend' | 'incoming' | 'outgoing' | 'none'; 
    reqId?: string;
  }) => {
    return (
      <div className="flex items-center gap-[10px] w-full min-h-[60px] h-[60px] px-[10px] py-[8px] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.07)] rounded-[10px] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
        
        {/* Identity Section */}
        <div 
          className="flex items-center gap-[10px] cursor-pointer flex-1 min-w-0"
          onClick={() => router.push(`/profile/${user.username || user.id}`)}
        >
          <div className="relative flex-shrink-0">
            <UserAvatar src={user.avatar_url} name={user.display_name} className="w-[36px] h-[36px] text-sm" />
            {user.is_online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#12B76A] border-[1.5px] border-[#0B0F12] rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center leading-tight">
            <span className="font-[600] text-[#101828] dark:text-[#F5F7FA] text-[13px] truncate leading-[18px]">
              {user.display_name}
            </span>
            <span className="text-[11px] text-[#667085] dark:text-[#A7AFB8] truncate leading-[16px]">
              @{user.username}
            </span>
          </div>
        </div>

        {/* Action Button Section (Right side, fits in row) */}
        <div className="flex-shrink-0 flex items-center gap-1.5 ml-2">
          {context === 'friend' && (
            <button
              onClick={() => handleStartChat(user)}
              disabled={isStartingChat === user.id}
              className="flex items-center gap-1.5 h-[30px] px-[11px] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-[8px] text-[12px] font-medium transition-colors"
            >
              {isStartingChat === user.id ? <Loader2 className="w-[15px] h-[15px] animate-spin" /> : <MessageSquare className="w-[15px] h-[15px]" />}
              Message
            </button>
          )}

          {context === 'incoming' && (
            <>
              <button
                onClick={async () => {
                  if(reqId) await respondToRequest(reqId, user.id, 'accepted');
                  fetchAllData();
                  if (query) performSearch(query);
                }}
                className="h-[30px] px-3 bg-[#8B5CF6] text-white rounded-[8px] text-[12px] font-medium hover:bg-[#7C3AED] transition-colors"
              >
                Accept
              </button>
              <button
                onClick={async () => {
                  if(reqId) await respondToRequest(reqId, user.id, 'declined');
                  fetchAllData();
                  if (query) performSearch(query);
                }}
                className="h-[30px] px-3 bg-[rgba(255,255,255,0.06)] text-[#A7AFB8] hover:bg-[rgba(255,255,255,0.1)] rounded-[8px] text-[12px] font-medium transition-colors border border-white/5"
              >
                Decline
              </button>
            </>
          )}

          {context === 'outgoing' && (
            <button
              onClick={async () => {
                if(reqId) await cancelRequest(reqId);
                fetchAllData();
                if (query) performSearch(query);
              }}
              className="h-[30px] px-3 bg-[rgba(240,68,56,0.1)] text-[#F04438] hover:bg-[rgba(240,68,56,0.2)] rounded-[8px] text-[12px] font-medium transition-colors"
            >
              Cancel
            </button>
          )}

          {context === 'none' && (
            <button
              onClick={async () => {
                await sendFriendRequest(user.id);
                fetchAllData();
                if (query) performSearch(query);
                else setRelationshipMap(prev => ({...prev, [user.id]: 'outgoing_request'}));
              }}
              className="h-[30px] px-3 bg-[#8B5CF6] text-white rounded-[8px] text-[12px] font-medium hover:bg-[#7C3AED] transition-colors"
            >
              Add
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 z-10 overflow-hidden relative bg-white dark:bg-[#0B0F12]">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* 1. MAIN CONTAINER (max-width 680px, compact padding) */}
        <div className="w-full max-w-[680px] mx-auto px-[20px] py-[24px]">
          
          {/* 2. HEADER */}
          <h1 className="text-[22px] leading-[28px] font-[650] text-[#101828] dark:text-[#F5F7FA] tracking-tight mb-[16px]">
            Friends
          </h1>

          {/* 3. SEARCH */}
          <div className="relative mb-[12px]">
            <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-[#A7AFB8]" />
            <input
              type="text"
              placeholder="Search people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.07)] rounded-[10px] h-[40px] pl-[36px] pr-[12px] text-[13px] text-[#101828] dark:text-[#F5F7FA] placeholder-[#A7AFB8] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
            />
            {isSearching && (
              <div className="absolute right-[12px] top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-[#A7AFB8] animate-spin" />
              </div>
            )}
          </div>

          {query.trim() ? (
            <div className="mb-[24px]">
              <h2 className="text-[14px] font-[600] text-[#101828] dark:text-[#F5F7FA] mb-[8px] px-1">Search Results</h2>
              {searchResults.length === 0 && !isSearching ? (
                <div className="text-center py-6">
                  <p className="text-[13px] text-[#A7AFB8]">No users found for "{query}"</p>
                </div>
              ) : (
                <div className="flex flex-col gap-[6px]">
                  {searchResults.map(p => {
                    let ctx: any = 'none';
                    const st = relationshipMap[p.id];
                    if (st === 'friend') ctx = 'friend';
                    else if (st === 'incoming_request') ctx = 'incoming';
                    else if (st === 'outgoing_request') ctx = 'outgoing';
                    return <CompactUserRow key={p.id} user={p} context={ctx} reqId={requestIds[p.id]} />;
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* 4. TABS */}
              <div className="flex p-[3px] bg-[rgba(255,255,255,0.04)] rounded-[10px] h-[38px] mb-[16px] border border-white/5">
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={cn(
                    "flex-1 h-[30px] text-[13px] font-[600] rounded-[8px] transition-all flex items-center justify-center gap-2",
                    activeTab === 'requests' 
                      ? "bg-[rgba(255,255,255,0.08)] text-[#F5F7FA] shadow-sm" 
                      : "text-[#A7AFB8] hover:text-[#F5F7FA]"
                  )}
                >
                  Requests
                  {incomingRequests.length > 0 && (
                    <span className="w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold bg-[#8B5CF6] text-white">
                      {incomingRequests.length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('friends')}
                  className={cn(
                    "flex-1 h-[30px] text-[13px] font-[600] rounded-[8px] transition-all flex items-center justify-center gap-2",
                    activeTab === 'friends' 
                      ? "bg-[rgba(255,255,255,0.08)] text-[#F5F7FA] shadow-sm" 
                      : "text-[#A7AFB8] hover:text-[#F5F7FA]"
                  )}
                >
                  My Friends
                  {friendships.length > 0 && (
                    <span className="text-[12px] opacity-70">({friendships.length})</span>
                  )}
                </button>
              </div>

              {activeTab === 'requests' ? (
                <div className="animate-in fade-in duration-200">
                  {/* Incoming */}
                  {incomingRequests.length > 0 && (
                    <div className="mb-[16px]">
                      <h2 className="text-[14px] font-[600] text-[#101828] dark:text-[#F5F7FA] mb-[8px] px-1 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-[#8B5CF6]" /> Incoming
                      </h2>
                      <div className="flex flex-col gap-[6px]">
                        {incomingRequests.map(req => (
                          <CompactUserRow key={req.id} user={req.sender!} context="incoming" reqId={req.id} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outgoing */}
                  {outgoingRequests.length > 0 && (
                    <div className="mb-[16px]">
                      <h2 className="text-[14px] font-[600] text-[#101828] dark:text-[#F5F7FA] mb-[8px] px-1 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#8B5CF6]" /> Sent
                      </h2>
                      <div className="flex flex-col gap-[6px]">
                        {outgoingRequests.map(req => (
                          <CompactUserRow key={req.id} user={req.receiver!} context="outgoing" reqId={req.id} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mb-[16px]">
                      <h2 className="text-[14px] font-[600] text-[#101828] dark:text-[#F5F7FA] mb-[8px] px-1">
                        Suggested for you
                      </h2>
                      <div className="flex flex-col gap-[6px]">
                        {suggestions.map(p => (
                          <CompactUserRow key={p.id} user={p} context="none" />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {incomingRequests.length === 0 && outgoingRequests.length === 0 && suggestions.length === 0 && (
                    <div className="text-center py-12">
                      <UserPlus className="w-[32px] h-[32px] text-[#A7AFB8] mx-auto mb-3" />
                      <h3 className="text-[14px] font-[600] text-[#F5F7FA] mb-1">No pending requests</h3>
                      <p className="text-[12px] text-[#A7AFB8]">Use the search bar above to find people.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-in fade-in duration-200">
                  {friendships.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-[32px] h-[32px] text-[#A7AFB8] mx-auto mb-3" />
                      <h3 className="text-[14px] font-[600] text-[#F5F7FA] mb-1">No friends yet</h3>
                      <p className="text-[12px] text-[#A7AFB8]">Search for people by their unique @username.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[6px]">
                      {friendships.map(f => {
                        if (!f.friend) return null;
                        return <CompactUserRow key={f.id} user={f.friend} context="friend" />;
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
