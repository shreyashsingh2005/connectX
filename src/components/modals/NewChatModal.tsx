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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-bg-surface dark:bg-bg-elevated rounded-[18px] shadow-xl border border-border-subtle overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-[0.98] duration-150 ease-out">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-[17px] font-semibold text-text-main">New Chat / Find Friends</h2>
          <button
            onClick={() => setShowNewChatModal(false)}
            className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-border-subtle border-border-subtle">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search username, e.g. @rahul123"
              className="w-full bg-[#F9FAFB] dark:bg-bg-primary border border-border-subtle border-border-subtle rounded-[12px] py-2.5 h-[44px] pl-10 pr-10 text-text-main placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/30 transition-all"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted animate-spin" />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-text-muted">
              Type a username or display name to search
            </div>
          ) : results.length === 0 && !isSearching ? (
            <div className="p-8 text-center text-text-muted">
              No connectX user found with that username.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-[12px] hover:bg-bg-secondary transition-colors text-left"
                >
                  <UserAvatar
                    src={user.avatar_url}
                    name={user.display_name}
                    size="md"
                    isOnline={user.is_online}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-main truncate">
                      {user.display_name}
                    </p>
                    <p className="text-[13px] text-text-muted truncate">@{user.username}</p>
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

