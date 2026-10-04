'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Profile } from '@/types';
import { debounce } from '@/lib/utils';
import toast from 'react-hot-toast';
import { X, Search, Loader2, Plus, Check, Users } from 'lucide-react';

export function GroupChatModal() {
  const [step, setStep] = useState<'select' | 'info'>('select');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const setShowGroupModal = useUIStore(s => s.setShowGroupModal);

  const search = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || !profile) { setResults([]); return; }
      setIsSearching(true);
      try {
        const { data } = await supabase.from('profiles').select('*').neq('id', profile.id).or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).limit(10);
        setResults(data || []);
      } finally { setIsSearching(false); }
    }, 300),
    [profile, supabase]
  );

  const toggleSelect = (user: Profile) => {
    setSelected(prev => prev.find(u => u.id === user.id) ? prev.filter(u => u.id !== user.id) : [...prev, user]);
  };

  async function handleCreate() {
    if (!profile || !groupName.trim() || selected.length < 1) return;
    setIsCreating(true);
    try {
      // Create group conversation
      const { data: conv, error } = await supabase.from('conversations').insert({
        type: 'group',
        name: groupName.trim(),
        created_by: profile.id,
      }).select().single();
      if (error) throw error;

      // Add all members (creator as owner, others as members)
      const members = [
        { conversation_id: conv.id, user_id: profile.id, role: 'owner' },
        ...selected.map(u => ({ conversation_id: conv.id, user_id: u.id, role: 'member' })),
      ];
      await supabase.from('conversation_members').insert(members);

      toast.success('Group created!');
      setShowGroupModal(false);
      router.push(`/chat/${conv.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGroupModal(false)} />
      <div className="relative w-full max-w-md bg-gray-50 dark:bg-[#111827] rounded-[20px] border border-gray-200 dark:border-white/5 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="font-semibold text-gray-900 dark:text-white">{step === 'select' ? 'New Group Chat' : 'Group Details'}</h2>
          </div>
          <button onClick={() => setShowGroupModal(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'select' ? (
          <>
            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 px-5 pt-4">
                {selected.map(u => (
                  <div key={u.id} className="flex items-center gap-1.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-full px-2.5 py-1">
                    <span className="text-xs text-[#8B5CF6]">{u.display_name}</span>
                    <button onClick={() => toggleSelect(u)} className="text-[#8B5CF6] hover:text-[#8B5CF6]/80">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="px-5 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text" value={query} autoFocus
                  onChange={e => { setQuery(e.target.value); search(e.target.value); }}
                  placeholder="Search users..."
                  className="w-full bg-gray-100 dark:bg-[#11161B] border border-gray-200 dark:border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#8B5CF6]/50 transition-all"
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto no-scrollbar px-2 pb-2">
              {results.map(user => {
                const isSelected = !!selected.find(u => u.id === user.id);
                return (
                  <button key={user.id} onClick={() => toggleSelect(user)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:bg-[#11161B] transition-colors text-left">
                    <UserAvatar src={user.avatar_url} name={user.display_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{user.display_name}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#8B5CF6]" />}
                  </button>
                );
              })}
              {!query.trim() && <div className="text-center py-4 text-gray-600 text-sm">Search to add members</div>}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 dark:border-white/5">
              <button
                onClick={() => setStep('info')}
                disabled={selected.length < 1}
                className="w-full bg-[#8B5CF6] text-white font-medium py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Next ({selected.length} selected)</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="px-5 py-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Group Name</label>
                <input
                  type="text" value={groupName} autoFocus
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="e.g. Team Alpha"
                  maxLength={50}
                  className="w-full bg-gray-100 dark:bg-[#11161B] border border-gray-200 dark:border-white/5 rounded-xl py-2.5 px-4 text-gray-900 dark:text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#8B5CF6]/50 transition-all"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Members ({selected.length + 1})</p>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-gray-200 dark:bg-[rgba(255,255,255,0.04)] rounded-full px-2.5 py-1">
                    <UserAvatar src={profile?.avatar_url} name={profile?.display_name || ''} size="sm" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{profile?.display_name} (you)</span>
                  </div>
                  {selected.map(u => (
                    <div key={u.id} className="flex items-center gap-1.5 bg-gray-200 dark:bg-[rgba(255,255,255,0.04)] rounded-full px-2.5 py-1">
                      <UserAvatar src={u.avatar_url} name={u.display_name} size="sm" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{u.display_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setStep('select')} className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-white/5 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:bg-[#11161B] transition-colors">Back</button>
              <button
                onClick={handleCreate}
                disabled={!groupName.trim() || isCreating}
                className="flex-1 bg-[#8B5CF6] text-white font-medium py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Group
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


