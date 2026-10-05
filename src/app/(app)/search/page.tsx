'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Profile, Message } from '@/types';
import { debounce, formatMessageTime } from '@/lib/utils';
import { Search, User, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ResultType = 'users' | 'messages';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ResultType>('users');
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [messageResults, setMessageResults] = useState<(Message & { conversation_id: string })[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);

  const searchSequence = useRef(0);

  const performSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || !profile) { 
        setUserResults([]); 
        setMessageResults([]); 
        setIsSearching(false);
        return; 
      }
      setIsSearching(true);
      const currentSeq = ++searchSequence.current;
      
      try {
        const [usersRes, messagesRes] = await Promise.all([
          supabase.from('profiles').select('*').neq('id', profile.id).or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).limit(10),
          supabase.from('messages').select('*, sender:profiles(id, display_name, avatar_url)').ilike('content', `%${q}%`).eq('is_deleted', false).order('created_at', { ascending: false }).limit(20),
        ]);
        
        if (currentSeq !== searchSequence.current) return;
        
        setUserResults(usersRes.data || []);
        setMessageResults((messagesRes.data || []) as (Message & { conversation_id: string })[]);
      } finally {
        if (currentSeq === searchSequence.current) {
          setIsSearching(false);
        }
      }
    }, 300),
    [profile, supabase]
  );
  
  // Also we need to make sure we call performSearch when query changes, because earlier maybe it wasn't hooked up cleanly?
  // Let's just fix the debounce and sequence for now.

  async function handleStartChat(targetProfile: Profile) {
    if (!profile) return;
    try {
      const { data: convId, error } = await supabase.rpc('start_direct_conversation', { 
        other_user_id: targetProfile.id 
      });
      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      if (convId) router.push(`/chat/${convId}`);
    } catch (error: any) {
      console.error('Error starting chat:', error);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-bg-primary">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-[22px] font-bold text-text-main mb-6">Search</h1>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sec" />
          <input
            type="text" value={query} autoFocus
            onChange={e => { setQuery(e.target.value); performSearch(e.target.value); }}
            placeholder="Search people, messages..."
            className="w-full bg-bg-surface border border-border-subtle border-border-subtle rounded-[12px] py-3 pl-10 pr-10 text-[14px] text-text-main placeholder-[#98A2B3] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] shadow-sm transition-all"
          />
          {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sec animate-spin" />}
        </div>

        {query.trim() && (
          <>
            <div className="flex gap-2 mb-6">
              {([['users', User, 'People'], ['messages', MessageSquare, 'Messages']] as [ResultType, typeof User, string][]).map(([tab, Icon, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={cn('flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all shadow-sm border', activeTab === tab ? 'bg-bg-surface border-border-subtle border-border-subtle text-text-main' : 'bg-bg-primary border-transparent text-text-sec hover:text-text-main dark:hover:text-text-main')}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {tab === 'users' && userResults.length > 0 && <span className="bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] text-text-main rounded-full px-1.5 py-0.5 text-[10px]">{userResults.length}</span>}
                  {tab === 'messages' && messageResults.length > 0 && <span className="bg-[#EAECF0] dark:bg-[rgba(255,255,255,0.08)] text-text-main rounded-full px-1.5 py-0.5 text-[10px]">{messageResults.length}</span>}
                </button>
              ))}
            </div>

            {activeTab === 'users' && (
              userResults.length === 0 ? <p className="text-center py-8 text-text-sec text-[14px]">No people found</p> : (
                <div className="space-y-2">
                  {userResults.map(user => (
                    <button key={user.id} onClick={() => handleStartChat(user)} className="w-full flex items-center gap-3 p-4 bg-bg-surface rounded-[16px] border border-border-subtle border-border-subtle hover:shadow-sm transition-all text-left">
                      <UserAvatar src={user.avatar_url} name={user.display_name} size="md" isOnline={user.is_online} />
                      <div>
                        <p className="font-medium text-text-main text-[14px]">{user.display_name}</p>
                        <p className="text-[12px] text-text-sec">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}

            {activeTab === 'messages' && (
              messageResults.length === 0 ? <p className="text-center py-8 text-text-sec text-[14px]">No messages found</p> : (
                <div className="space-y-2">
                  {messageResults.map(msg => (
                    <button key={msg.id} onClick={() => router.push(`/chat/${msg.conversation_id}`)} className="w-full flex items-start gap-3 p-4 bg-bg-surface rounded-[16px] border border-border-subtle border-border-subtle hover:shadow-sm transition-all text-left">
                      <UserAvatar src={(msg.sender as Profile | undefined)?.avatar_url} name={(msg.sender as Profile | undefined)?.display_name || 'User'} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-text-main text-[14px]">{(msg.sender as Profile | undefined)?.display_name}</p>
                          <span className="text-[12px] text-text-sec">{formatMessageTime(msg.created_at)}</span>
                        </div>
                        <p className="text-[13px] text-text-main truncate mt-0.5">
                          {msg.content?.split(new RegExp(`(${query})`, 'gi')).map((part, i) =>
                            part.toLowerCase() === query.toLowerCase()
                              ? <mark key={i} className="bg-brand/20 text-brand rounded px-0.5">{part}</mark>
                              : part
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}
          </>
        )}

        {!query.trim() && (
          <div className="text-center py-16 bg-bg-surface rounded-[16px] border border-dashed border-border-subtle border-border-subtle shadow-sm">
            <div className="w-12 h-12 bg-bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="w-5 h-5 text-text-sec" />
            </div>
            <p className="text-[14px] text-text-sec font-medium">Type to search across connectX</p>
          </div>
        )}
      </div>
    </div>
  );
}
