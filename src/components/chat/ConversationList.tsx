'use client';
import { useEffect } from 'react';
import { useE2EE } from '@/hooks/useE2EE';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useConversations } from '@/hooks/useConversations';
import { ConversationItemSkeleton } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn, formatConversationTime, truncateText } from '@/lib/utils';
import { Search, Plus, Users, Pin, Bell } from 'lucide-react';
import Link from 'next/link';
import { Conversation } from '@/types';

function DecryptedPreview({ content, conversationId }: { content: string, conversationId: string }) {
  const { decrypt, isReady } = useE2EE(conversationId);
  const [text, setText] = useState('');
  
  useEffect(() => {
    if (!isReady) return;
    let mounted = true;
    decrypt(content).then((res: string) => {
      if (mounted) setText(res);
    }).catch(() => {
      if (mounted) setText('Encrypted message');
    });
    return () => { mounted = false; };
  }, [content, decrypt, isReady]);
  
  return <>{text.length > 40 ? text.substring(0, 40) + '...' : text}</>;
}

export function ConversationList() {
  const router = useRouter();
  const [clearedChats, setClearedChats] = useState<Record<string, string>>({});
  const [deletedLocalIds, setDeletedLocalIds] = useState<string[]>([]);

  useEffect(() => {
    const loadCleared = () => {
      try {
        setClearedChats(JSON.parse(localStorage.getItem('cleared_chats') || '{}'));
        setDeletedLocalIds(JSON.parse(localStorage.getItem('deleted_messages') || '[]'));
      } catch (e) {}
    };
    loadCleared();
    window.addEventListener('storage', loadCleared);
    // Also listen to a custom event for same-tab updates
    window.addEventListener('chat_cleared', loadCleared);
    return () => {
      window.removeEventListener('storage', loadCleared);
      window.removeEventListener('chat_cleared', loadCleared);
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const profile = useAuthStore(s => s.profile);
  const activeId = useChatStore(s => s.activeConversationId);
  const pinnedMessageIds = useChatStore(s => s.pinnedMessageIds);
  const { conversations, isLoadingConversations } = useConversations();
  const setShowNewChatModal = useUIStore(s => s.setShowNewChatModal);
  const setShowGroupModal = useUIStore(s => s.setShowGroupModal);

  const filtered = useMemo(() => {
    let list = conversations;
    
    // Hide cleared conversations unless they are currently active
    list = list.filter(c => {
      if (c.id === activeId) return true;
      const clearedAt = clearedChats[c.id];
      // If it has a clearedAt timestamp, and the last message is older than or equal to clearedAt, hide it
      if (clearedAt && c.last_message_at && new Date(c.last_message_at) <= new Date(clearedAt)) {
        return false;
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => {
        const name = c.type === 'direct' ? c.other_member?.display_name : c.name;
        return name?.toLowerCase().includes(q);
      });
    }
    if (filter === 'unread') list = list.filter(c => (c.unread_count || 0) > 0);
    if (filter === 'pinned') list = list.filter(c => Object.keys(pinnedMessageIds[c.id] || {}).length > 0);
    return list;
  }, [conversations, searchQuery, filter, clearedChats, activeId, pinnedMessageIds]);

  function getConversationName(conv: Conversation) {
    return conv.type === 'direct' ? (conv.other_member?.display_name || 'Unknown') : (conv.name || 'Group');
  }

  function getConversationAvatar(conv: Conversation) {
    return conv.type === 'direct' ? conv.other_member?.avatar_url : conv.avatar_url;
  }

    function getLastMessagePreview(conv: Conversation) {
      const clearedAt = clearedChats[conv.id];
      if (conv.last_message && deletedLocalIds.includes(conv.last_message.id)) return 'No messages yet';
      if (clearedAt && conv.last_message && new Date(conv.last_message.created_at) <= new Date(clearedAt)) {
        return 'No messages yet';
      }

      if (!conv.last_message) return 'No messages yet';
      const msg = conv.last_message;
      if (msg.is_deleted) return 'Message deleted'; // removed emoji to avoid encoding bugs
      if (msg.type !== 'text' && msg.type !== 'system') {
        return msg.type === 'image' ? 'Image' :
               msg.type === 'video' ? 'Video' :
               msg.type === 'audio' ? 'Audio' : 'File';
      }
      return <DecryptedPreview content={msg.content || ''} conversationId={conv.id} />;
    }

  function handleSelectConversation(conv: Conversation) {
    router.push(`/chat/${conv.id}`);
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0B0F12] border-r border-[#EAECF0] dark:border-white/5 w-full md:w-[320px] flex-shrink-0">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">Chats</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowGroupModal(true)}
              title="New Group"
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-200 hover:bg-[#F9FAFB] dark:hover:bg-[rgba(255,255,255,0.04)] transition-all"
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowNewChatModal(true)}
              title="New Chat"
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center bg-[#8B5CF6] text-white hover:bg-[#7C3AED] shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
          <input
            type="text"
            autoComplete="off"
            spellCheck="false"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#F9FAFB] dark:bg-[#11161B] border border-[#EAECF0] dark:border-white/5 rounded-full py-2 h-[40px] pl-10 pr-4 text-[13px] text-gray-900 dark:text-white placeholder-[#737C86] focus:outline-none focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/20 transition-all shadow-sm dark:shadow-none"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mt-4">
          {(['all', 'unread', 'pinned'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 text-[13px] rounded-full font-medium transition-all duration-150 capitalize flex items-center justify-center gap-1.5',
                filter === f
                  ? 'bg-[#8B5CF6] text-white'
                  : 'bg-transparent text-[#667085] hover:bg-[#F9FAFB] dark:hover:bg-[rgba(255,255,255,0.04)]'
              )}
            >
              {f === 'pinned' ? <Pin className="w-3.5 h-3.5" /> : null}
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {isLoadingConversations ? (
          Array.from({ length: 6 }).map((_, i) => <ConversationItemSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState
            variant={searchQuery ? 'no-search-results' : 'no-conversations'}
            action={
              !searchQuery ? (
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-[#8B5CF6] text-white text-[13px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#7C3AED] shadow-sm transition-colors"
                >
                  Start a conversation
                </button>
              ) : undefined
            }
          />
        ) : (
          filtered.map(conv => {
            const isActive = conv.id === activeId;
            const name = getConversationName(conv);
            const avatarUrl = getConversationAvatar(conv);
            const isOnline = conv.type === 'direct' ? conv.other_member?.is_online : false;
            const unreadCount = conv.unread_count || 0;
            const clearedAt = clearedChats[conv.id];
              const isCleared = clearedAt && conv.last_message_at && new Date(conv.last_message_at) <= new Date(clearedAt);
              const lastMsgTime = (!isCleared && conv.last_message_at) ? formatConversationTime(conv.last_message_at) : '';

            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={cn('w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left group relative border-b border-[#EAECF0] dark:border-white/5 last:border-0',
                  isActive ? 'bg-[#F1F3F5] dark:bg-[rgba(255,255,255,0.04)]' : 'hover:bg-[#F1F3F5] dark:hover:bg-[rgba(255,255,255,0.02)] bg-transparent'
                )}
              >
                {/* Avatar */}
                <div className="w-[44px] h-[44px] flex-shrink-0">
                  <UserAvatar
                    src={avatarUrl}
                    name={name}
                    size="md"
                    isOnline={isOnline}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      'font-bold text-[14px] truncate',
                      isActive ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'
                    )}>
                      {name}
                    </span>
                    <span className={cn("text-[11px] flex-shrink-0", unreadCount > 0 ? "text-[#8B5CF6]" : "text-[#667085] dark:text-[#737C86]")}>{lastMsgTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className={cn(
                      'text-[12px] truncate',
                      unreadCount > 0 ? 'text-gray-900 dark:text-[#F5F7FA] font-medium' : 'text-[#667085] dark:text-[#A7AFB8]'
                    )}>
                      {getLastMessagePreview(conv)}
                    </span>
                    {unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#8B5CF6] text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
