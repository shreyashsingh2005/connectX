'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Profile, Friendship } from '@/types';
import { cn, debounce } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, Loader2, MessageSquare, Check, X as XIcon, Clock, UserPlus, Users , MoreHorizontal } from 'lucide-react';
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
      const { data: fData } = await supabase
        .from('friendships')
        .select('*, friend:profiles!friendships_friend_id_fkey(*)')
        .eq('user_id', profile.id);
        
      setFriendships(fData || []);
      
      const newMap: Record<string, any> = {};
      fData?.forEach(f => {
        newMap[f.friend_id] = 'friend';
      });

      const { data: rData } = await supabase
        .from('friend_requests')
        .select('*, sender:profiles!friend_requests_sender_id_fkey(*), receiver:profiles!friend_requests_receiver_id_fkey(*)')
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

      setSuggestions(prev => {
        if (prev.length === 0) {
          const excludeIds = [profile.id, ...Object.keys(newMap)];
          let queryBuilder = supabase.from('profiles').select('*').limit(5);
          if (excludeIds.length > 0) {
             queryBuilder = queryBuilder.not('id', 'in', `(${excludeIds.join(',')})`);
          }
          queryBuilder.then(res => setSuggestions(res.data || []));
        }
        return prev;
      });
    } catch (err) {
      console.error(err);
    }
  }, [profile, supabase]);

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

  const searchSequence = useRef(0);

  const performSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || !profile) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      const currentSeq = ++searchSequence.current;
      
      try {
        const searchTerm = q.toLowerCase();
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', profile.id)
          .or(`username_normalized.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
          .limit(20);
          
        // Ignore if a newer search has started
        if (currentSeq !== searchSequence.current) return;
        
        setSearchResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (currentSeq === searchSequence.current) {
          setIsSearching(false);
        }
      }
    }, 400),
    [profile, supabase]
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
      <div className="flex items-center gap-[10px] w-full h-[64px] px-4 border-b border-border-subtle bg-transparent last:border-b-0 hover:bg-bg-secondary transition-colors duration-150">
        
        {/* Identity Section */}
        <div 
          className="flex items-center gap-[10px] cursor-pointer flex-1 min-w-0"
          onClick={() => router.push(`/profile/${user.username || user.id}`)}
        >
          <div className="relative flex-shrink-0">
            <UserAvatar src={user.avatar_url} name={user.display_name} className="w-[40px] h-[40px] text-[13px]" />
            {user.is_online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#12B76A] border-[1.5px] border-[#0B0F12] rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center leading-tight">
            <span className="font-[600] text-text-main text-[14px] truncate leading-[18px]">
              {user.display_name}
            </span>
            <span className="text-[12px] text-text-sec truncate leading-[16px]">
              @{user.username}
            </span>
          </div>
        </div>

        {/* Action Button Section (Right side, fits in row) */}
        <div className="flex-shrink-0 flex items-center gap-2 ml-2">
          {context === 'friend' && (
            <>
              <button
                onClick={() => handleStartChat(user)}
                disabled={isStartingChat === user.id}
                className="flex items-center gap-1.5 h-[32px] px-3 bg-brand/10 hover:bg-brand/20 text-brand rounded-[8px] text-[12px] font-[600] transition-colors"
              >
                {isStartingChat === user.id ? <Loader2 className="w-[15px] h-[15px] animate-spin" /> : <MessageSquare className="w-[15px] h-[15px]" />}
                Message
              </button>
              <button className="flex items-center justify-center w-[32px] h-[32px] bg-transparent hover:bg-bg-secondary text-text-sec rounded-[8px] transition-colors">
                <MoreHorizontal size={16} strokeWidth={1.75} />
              </button>
            </>
          )}

          {context === 'incoming' && (
            <>
              <button
                onClick={async () => {
                  if(reqId) await respondToRequest(reqId, user.id, 'accepted');
                  fetchAllData();
                  
                }}
                className="h-[32px] px-4 bg-brand text-white rounded-[8px] text-[12px] font-[600] hover:bg-brand-dark transition-colors"
              >
                Accept
              </button>
              <button
                onClick={async () => {
                  if(reqId) await respondToRequest(reqId, user.id, 'declined');
                  fetchAllData();
                  
                }}
                className="h-[32px] px-4 bg-bg-surface text-text-main hover:bg-bg-secondary rounded-[8px] text-[12px] font-[600] transition-colors border border-border-subtle">
                Decline
              </button>
            </>
          )}

          {context === 'outgoing' && (
            <button
              onClick={async () => {
                if(reqId) await cancelRequest(reqId);
                fetchAllData();
                
              }}
              className="h-[32px] px-4 bg-bg-surface text-text-main hover:bg-bg-secondary rounded-[8px] text-[12px] font-[600] transition-colors border border-border-subtle">
              Cancel
            </button>
          )}

          {context === 'none' && (
            <button
              onClick={async () => {
                await sendFriendRequest(user.id);
                fetchAllData();
                setRelationshipMap(prev => ({...prev, [user.id]: 'outgoing_request'}));
              }}
              className="h-[32px] px-4 bg-brand text-white rounded-[8px] text-[12px] font-[600] hover:bg-brand-dark transition-colors"
            >
              Add
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 z-10 overflow-hidden relative bg-bg-primary">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* 1. MAIN CONTAINER (max-width 680px, compact padding) */}
        <div className="w-full max-w-[720px] mx-auto px-4 md:px-6 py-4 md:py-6">
          
          {/* 2. HEADER */}
          <h1 className="text-[22px] font-[700] text-text-main mb-6">
            Friends
          </h1>

          {/* 3. SEARCH */}
          <div className="relative mb-[12px]">
            <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-text-sec" />
            <input
              type="text"
              placeholder="Search people..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim()) setIsSearching(true);
              }}
              className="w-full bg-bg-secondary border border-border-subtle rounded-[10px] h-[42px] pl-[36px] pr-[12px] text-[13px] text-text-main placeholder-[#667085] dark:placeholder-[#A7AFB8] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
            />
            {isSearching && (
              <div className="absolute right-[12px] top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-text-sec animate-spin" />
              </div>
            )}
          </div>

          {query.trim() ? (
            <div className="mb-[24px]">
              <h2 className="text-[13px] font-[600] text-text-main mt-4 mb-2 px-1">Search Results</h2>
              {searchResults.length === 0 && !isSearching ? (
                <EmptyState variant="no-search-results" />
              ) : (
                <div className="flex flex-col bg-bg-surface border border-border-subtle rounded-[10px] overflow-hidden">
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
              <div className="flex p-1 bg-bg-secondary rounded-[10px] h-[40px] mb-6 border border-border-subtle">
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={cn(
                    "flex-1 h-[32px] text-[13px] font-[600] rounded-[8px] transition-all duration-150 flex items-center justify-center gap-2",
                    activeTab === 'requests' 
                      ? "bg-brand/10 text-brand shadow-none" 
                      : "bg-transparent text-text-sec dark:text-[#98A2B3]"
                  )}
                >
                  Requests
                  {incomingRequests.length > 0 && (
                    <span className="w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold bg-brand-soft text-brand">
                      {incomingRequests.length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('friends')}
                  className={cn(
                    "flex-1 h-[32px] text-[13px] font-[600] rounded-[8px] transition-all duration-150 flex items-center justify-center gap-2",
                    activeTab === 'friends' 
                      ? "bg-brand/10 text-brand shadow-none" 
                      : "bg-transparent text-text-sec dark:text-[#98A2B3]"
                  )}
                >
                  My Friends
                  {friendships.length > 0 && (
                    <span className="w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold bg-brand-soft text-brand">
                      {friendships.length}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === 'requests' ? (
                <div className="animate-in fade-in duration-150">
                  {/* Incoming */}
                  {incomingRequests.length > 0 && (
                    <div className="mb-[16px]">
                      <h2 className="text-[13px] font-[600] text-text-main mt-4 mb-2 px-1 flex items-center gap-2">
                        Friend requests
                      </h2>
                      <div className="flex flex-col bg-bg-surface border border-border-subtle rounded-[10px] overflow-hidden">
                        {incomingRequests.map(req => (
                          <CompactUserRow key={req.id} user={req.sender!} context="incoming" reqId={req.id} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outgoing */}
                  {outgoingRequests.length > 0 && (
                    <div className="mb-[16px]">
                      <h2 className="text-[13px] font-[600] text-text-main mt-4 mb-2 px-1 flex items-center gap-2">
                        Sent requests
                      </h2>
                      <div className="flex flex-col bg-bg-surface border border-border-subtle rounded-[10px] overflow-hidden">
                        {outgoingRequests.map(req => (
                          <CompactUserRow key={req.id} user={req.receiver!} context="outgoing" reqId={req.id} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mb-[16px]">
                      <h2 className="text-[13px] font-[600] text-text-main mt-4 mb-2 px-1">
                        Suggested for you
                      </h2>
                      <div className="flex flex-col bg-bg-surface border border-border-subtle rounded-[10px] overflow-hidden">
                        {suggestions.map(p => (
                          <CompactUserRow key={p.id} user={p} context="none" />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {incomingRequests.length === 0 && outgoingRequests.length === 0 && suggestions.length === 0 && (
                    <div className="text-center py-8">
                      <UserPlus className="w-[32px] h-[32px] text-text-sec mx-auto mb-3" />
                      <h3 className="text-[14px] font-[600] text-text-main mb-1">No pending requests</h3>
                      <p className="text-[12px] text-text-sec">When someone sends you a friend request, it will appear here.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-in fade-in duration-150">
                  {friendships.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-[32px] h-[32px] text-text-sec mx-auto mb-3" />
                      <h3 className="text-[14px] font-[600] text-text-main mb-1">No friends yet</h3>
                      <p className="text-[12px] text-text-sec">Search for people by their unique @username.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col bg-bg-surface border border-border-subtle rounded-[10px] overflow-hidden">
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
