'use client';

import { useState, useCallback } from 'react';
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

  const performSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || !profile) { setUserResults([]); setMessageResults([]); return; }
      setIsSearching(true);
      try {
        const [usersRes, messagesRes] = await Promise.all([
          supabase.from('profiles').select('*').neq('id', profile.id).or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).limit(10),
          supabase.from('messages').select('*, sender:profiles(id, display_name, avatar_url)').ilike('content', `%${q}%`).eq('is_deleted', false).order('created_at', { ascending: false }).limit(20),
        ]);
        setUserResults(usersRes.data || []);
        setMessageResults((messagesRes.data || []) as (Message & { conversation_id: string })[]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [profile, supabase]
  );

  async function handleStartChat(targetProfile: Profile) {
    if (!profile) return;
    const { data, error } = await supabase.rpc('get_or_create_direct_conversation', { p_user1_id: profile.id, p_user2_id: targetProfile.id });
    if (!error) router.push(`/chat/${data}`);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0B0F19]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Search</h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text" value={query} autoFocus
            onChange={e => { setQuery(e.target.value); performSearch(e.target.value); }}
            placeholder="Search people, messages..."
            className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#252A34] rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:border-[#8B5CF6]/50 transition-all"
          />
          {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />}
        </div>

        {query.trim() && (
          <>
            <div className="flex gap-2 mb-6">
              {([['users', User, 'People'], ['messages', MessageSquare, 'Messages']] as [ResultType, typeof User, string][]).map(([tab, Icon, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all', activeTab === tab ? 'bg-[#8B5CF6] text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-[#111827]')}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {tab === 'users' && userResults.length > 0 && <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px]">{userResults.length}</span>}
                  {tab === 'messages' && messageResults.length > 0 && <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px]">{messageResults.length}</span>}
                </button>
              ))}
            </div>

            {activeTab === 'users' && (
              userResults.length === 0 ? <p className="text-center py-8 text-gray-500">No people found</p> : (
                <div className="space-y-2">
                  {userResults.map(user => (
                    <button key={user.id} onClick={() => handleStartChat(user)} className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-[#252A34] hover:border-[#8B5CF6]/20 transition-all text-left">
                      <UserAvatar src={user.avatar_url} name={user.display_name} size="sm" isOnline={user.is_online} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.display_name}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}

            {activeTab === 'messages' && (
              messageResults.length === 0 ? <p className="text-center py-8 text-gray-500">No messages found</p> : (
                <div className="space-y-2">
                  {messageResults.map(msg => (
                    <button key={msg.id} onClick={() => router.push(`/chat/${msg.conversation_id}`)} className="w-full flex items-start gap-3 p-4 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-[#252A34] hover:border-[#8B5CF6]/20 transition-all text-left">
                      <UserAvatar src={(msg.sender as Profile | undefined)?.avatar_url} name={(msg.sender as Profile | undefined)?.display_name || 'User'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{(msg.sender as Profile | undefined)?.display_name}</p>
                          <span className="text-xs text-gray-500">{formatMessageTime(msg.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                          {msg.content?.split(new RegExp(`(${query})`, 'gi')).map((part, i) =>
                            part.toLowerCase() === query.toLowerCase()
                              ? <mark key={i} className="bg-pink-500/30 text-[#8B5CF6] rounded px-0.5">{part}</mark>
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
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Type to search across connectX</p>
          </div>
        )}
      </div>
    </div>
  );
}

