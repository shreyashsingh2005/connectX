'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Profile } from '@/types';
import { debounce } from '@/lib/utils';
import { X, Search, Loader2 } from 'lucide-react';

export function NewChatModal() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const setShowNewChatModal = useUIStore(s => s.setShowNewChatModal);

  const search = useCallback(
    debounce(async (q: string) => {
      const cleanQ = q.trim().replace(/^@/, '');
      if (!cleanQ || !profile) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const normalized = cleanQ.toLowerCase();
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', profile.id)
          .or(`username_normalized.ilike.%${normalized}%,display_name.ilike.%${cleanQ}%`)
          .limit(10);
        setResults(data || []);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [profile, supabase]
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    search(e.target.value);
  };

  function handleSelect(targetProfile: Profile) {
    setShowNewChatModal(false);
    router.push(`/profile/${targetProfile.username || targetProfile.id}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#252A34] overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-gray-100 dark:border-[#252A34] flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Chat / Find Friends</h2>
          <button
            onClick={() => setShowNewChatModal(false)}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[#151922] hover:bg-gray-200 dark:hover:bg-[#374151] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-[#252A34]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search username, e.g. @rahul123"
              className="w-full bg-gray-50 dark:bg-[#0B0F19] border border-gray-200 dark:border-[#252A34] rounded-xl py-3 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/30 transition-all"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Type a username or display name to search
            </div>
          ) : results.length === 0 && !isSearching ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No connectX user found with that username.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors text-left"
                >
                  <UserAvatar
                    src={user.avatar_url}
                    name={user.display_name}
                    size="md"
                    isOnline={user.is_online}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {user.display_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

