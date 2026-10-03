'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageBubble } from './MessageBubble';
import { useE2EE } from '@/hooks/useE2EE';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { MessageSkeleton } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Message } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';

const PAGE_SIZE = 40;

interface MessageListProps {
  conversationId: string;
}

function DateSeparator({ date }: { date: Date }) {
  const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMMM d, yyyy');
  return (
    <div className="flex items-center gap-3 my-4 px-4">
      <div className="flex-1 h-px bg-gray-200 dark:bg-[#151922]" />
      <span className="text-xs text-gray-500 font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-[#151922]" />
    </div>
  );
}

export function MessageList({ conversationId }: MessageListProps) {
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const messagesMap = useChatStore(s => s.messages);
  const messages = messagesMap[conversationId] || [];
  const allTypingUsers = useChatStore(s => s.typingUsers);
  const typingUsers = allTypingUsers.filter(u => u.conversationId === conversationId && u.userId !== profile?.id);
  const isLoadingMessages = useChatStore(s => s.isLoadingMessages);
  const setMessages = useChatStore(s => s.setMessages);
  const addMessage = useChatStore(s => s.addMessage);
  const updateMessage = useChatStore(s => s.updateMessage);
  const updateConversation = useChatStore(s => s.updateConversation);
  const conversation = useChatStore(s => s.conversations.find(c => c.id === conversationId));
  const forceReadAt = (conversation as any)?.forceReadAt;
  const unreadCount = conversation?.unread_count || 0;
  const otherMemberReadAt = forceReadAt || conversation?.members?.find((m: any) => m.user_id !== profile?.id)?.last_read_at;
  const prependMessages = useChatStore(s => s.prependMessages);
  const setIsLoadingMessages = useChatStore(s => s.setIsLoadingMessages);
  const setReplyToMessage = useChatStore(s => s.setReplyToMessage);
  const addTypingUser = useChatStore(s => s.addTypingUser);
  const removeTypingUser = useChatStore(s => s.removeTypingUser);
  const bulkUpdateMessages = useChatStore(s => s.bulkUpdateMessages);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deleteModalMsg, setDeleteModalMsg] = useState<Message | null>(null);
  const [deletedLocalIds, setDeletedLocalIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      setDeletedLocalIds(JSON.parse(localStorage.getItem('deleted_messages') || '[]'));
    } catch {}
  }, []);

  const oldestMessageIdRef = useRef<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [latestLocalMessageId, setLatestLocalMessageId] = useState<string | null>(null);
  const isFirstLoad = useRef(true);
  const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const { isReady, decrypt, e2eeState } = useE2EE(conversationId);

  // Retry decryption if key state becomes ready (e.g., after realtime key rotation auto-provisioning)
  useEffect(() => {
    if (isReady && messages.length > 0) {
      const updates = messages
        .filter(m => m.decryption_error)
        .map(m => ({ id: m.id, changes: { decrypted_content: undefined, decryption_error: undefined } as any }));
      if (updates.length > 0) {
        bulkUpdateMessages(conversationId, updates);
      }
    }
  }, [isReady, conversationId]);

  // If E2EE falls into a permanent error state, mark all undecided messages as decryption errors
  useEffect(() => {
    if (e2eeState !== 'error' || messages.length === 0) return;
    
    const toFail = messages.filter(m => 
      m.content && 
      m.decrypted_content === undefined && 
      m.status !== 'sending' && 
      m.status !== 'failed' &&
      m.type !== 'system' &&
      !m.decryption_error
    );

    if (toFail.length === 0) return;

    const updates = toFail.map(msg => ({
      id: msg.id,
      changes: { decrypted_content: null, decryption_error: true }
    }));
    
    bulkUpdateMessages(conversationId, updates);
  }, [messages, e2eeState, conversationId, bulkUpdateMessages]);

  useEffect(() => {
    if (!isReady || messages.length === 0) return;
    
    const toDecrypt = messages.filter(m => 
      m.content && 
      m.decrypted_content === undefined && 
      m.status !== 'sending' && 
      m.status !== 'failed' &&
      m.type !== 'system'
    );
    
    if (toDecrypt.length === 0) return;

    let isMounted = true;
    
    const processBatch = async () => {
      const updates = await Promise.all(toDecrypt.map(async msg => {
        try {
            let decrypted: string;
            try {
              decrypted = await decrypt(msg.content!);
            } catch (innerErr) {
              if (process.env.NODE_ENV === 'development') { console.error('[E2EE] Decryption failed for message', msg.id); }
              throw innerErr;
            }
          return { id: msg.id, changes: { decrypted_content: decrypted } };
        } catch (e: any) {
          return { id: msg.id, changes: { decrypted_content: null, decryption_error: true } };
        }
      }));
      
      if (isMounted) {
        bulkUpdateMessages(conversationId, updates);
      }
    };
    
    processBatch();
    
    return () => { isMounted = false; };
  }, [messages, isReady, conversationId, bulkUpdateMessages, decrypt]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const loadMessages = useCallback(async (beforeId?: string) => {
    if (!conversationId || !profile) return;
    
    // Prevent UI wipe on reconnect by checking if we already have messages
    const current = useChatStore.getState().messages[conversationId] || [];
    if (!beforeId && current.length === 0) setIsLoadingMessages(true);
    else if (beforeId) setIsLoadingMore(true);
    
    setFetchError(null);

    try {
      let query = supabase
        .from('messages')
        .select('*, sender:profiles(id, username, display_name, avatar_url), attachments(*), reactions:message_reactions(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (beforeId) {
        const { data: beforeMsg } = await supabase.from('messages').select('created_at').eq('id', beforeId).single();
        if (beforeMsg) query = query.lt('created_at', beforeMsg.created_at);
      }

      const { data } = await query;
      if (!data) return;

      let ordered = [...data].reverse();
      
      const clearedChats = JSON.parse(localStorage.getItem('cleared_chats') || '{}');
      const clearTime = clearedChats[conversationId];
      if (clearTime) {
        ordered = ordered.filter(m => new Date(m.created_at).getTime() > new Date(clearTime).getTime());
        // If we filtered out all messages because they were cleared, we should stop fetching older ones
        if (ordered.length === 0 && data.length > 0) {
          setHasMore(false);
          return;
        }
      }
      
      setHasMore(data.length === PAGE_SIZE);

      if (!beforeId) {
        if (current.length === 0) {
          setMessages(conversationId, ordered);
        } else {
          ordered.forEach(msg => useChatStore.getState().addMessage(conversationId, msg as any));
        }
        
        // ALWAYS update oldestMessageIdRef to the oldest fetched message (even if filtered out)
        if (data.length > 0) {
          oldestMessageIdRef.current = data[data.length - 1].id;
        }
        if (ordered.length > 0) {
          setLatestLocalMessageId(ordered[ordered.length - 1].id);
        }
      } else {
        if (ordered.length > 0) {
          prependMessages(conversationId, ordered);
        }
        if (data.length > 0) {
          oldestMessageIdRef.current = data[data.length - 1].id;
        }
      }
      
      if (!beforeId && ordered.length > 0) {
        const unreadCount = useChatStore.getState().conversations.find(c => c.id === conversationId)?.unread_count || 0;
        if (unreadCount > 0) {
          useChatStore.getState().updateConversation(conversationId, { unread_count: 0 });
          (window as any).__chat_channel?.send({ type: 'broadcast', event: 'read', payload: { userId: profile.id } });
          await supabase.from('messages').update({ status: 'read' }).eq('conversation_id', conversationId).neq('sender_id', profile.id).neq('status', 'read');
          await supabase.from('conversation_members').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', conversationId).eq('user_id', profile.id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setFetchError("Failed to load messages.");
    } finally {
      setIsLoadingMessages(false);
      setIsLoadingMore(false);
    }
  }, [conversationId, profile, supabase, setMessages, prependMessages, setIsLoadingMessages]);

  useEffect(() => {
    setMessages(conversationId, []);
    setHasMore(true);
    isFirstLoad.current = true;
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      scrollToBottom('instant');
      isFirstLoad.current = false;
    } else if (messages.length > 0) {
      const last = messages[messages.length - 1]; // We don't need to change this for scroll logic
      if (last.sender_id === profile?.id) scrollToBottom();
    }
  }, [messages.length]);

  useEffect(() => {
    if (!conversationId || !profile) return;

    
    const channel = supabase
      .channel(`room:${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== profile.id) {
          addTypingUser({ userId: payload.userId, username: payload.username, conversationId });
            const key = `${payload.userId}-${conversationId}`;
            if (typingTimeouts.current[key]) clearTimeout(typingTimeouts.current[key]);
            typingTimeouts.current[key] = setTimeout(() => {
              removeTypingUser(payload.userId, conversationId);
          const key = `${payload.userId}-${conversationId}`;
          if (typingTimeouts.current[key]) clearTimeout(typingTimeouts.current[key]);
            }, 3000);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
        removeTypingUser(payload.userId, conversationId);
          const key = `${payload.userId}-${conversationId}`;
          if (typingTimeouts.current[key]) clearTimeout(typingTimeouts.current[key]);
      })
      .on('broadcast', { event: 'read' }, ({ payload }) => {
        if (payload.userId !== profile.id) {
          useChatStore.getState().updateConversation(conversationId, { forceReadAt: new Date().toISOString() } as any);
          
          const currentMessages = useChatStore.getState().messages[conversationId] || [];
          const updates = currentMessages
            .filter(m => m.sender_id === profile.id && m.status !== 'read')
            .map(m => ({ id: m.id, changes: { status: 'read' as any } }));
          if (updates.length > 0) {
            useChatStore.getState().bulkUpdateMessages(conversationId, updates);
          }
        }
      })
      .subscribe((status) => {
        (window as any).__chat_channel = channel;
        if (status === 'SUBSCRIBED') {
          if (profile && unreadCount > 0) {
            supabase.from('conversation_members').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', conversationId).eq('user_id', profile.id).then();
              supabase.from('messages').update({ status: 'read' }).eq('conversation_id', conversationId).neq('sender_id', profile.id).neq('status', 'read').then();
            updateConversation(conversationId, { unread_count: 0 });
            channel.send({ type: 'broadcast', event: 'read', payload: { userId: profile.id } });
          }
          setIsReconnecting(prev => {
            if (prev) {
              loadMessages(); // Refetch missed messages
            }
            return false;
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsReconnecting(true);
        }
      });


    return () => { supabase.removeChannel(channel); };
  }, [conversationId, profile?.id]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || !hasMore || isLoadingMore) return;
    if (el.scrollTop < 100) {
      const savedScrollHeight = el.scrollHeight;
      loadMessages(oldestMessageIdRef.current || undefined).then(() => {
        requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - savedScrollHeight; });
      });
    }
  }, [hasMore, isLoadingMore, loadMessages]);

  async function handleReact(messageId: string, emoji: string) {
    if (!profile) return;
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    let newReactions = [...(msg.reactions || [])];
    const existingIdx = newReactions.findIndex(r => r.emoji === emoji && r.user_id === profile.id);
    
    if (existingIdx !== -1) {
      newReactions.splice(existingIdx, 1);
      useChatStore.getState().updateMessage(conversationId, messageId, { reactions: newReactions });
      await supabase.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', profile.id).eq('emoji', emoji);
    } else {
      const newReaction = { id: Math.random().toString(), message_id: messageId, user_id: profile.id, emoji, created_at: new Date().toISOString(), profile: profile as any };
      newReactions.push(newReaction);
      useChatStore.getState().updateMessage(conversationId, messageId, { reactions: newReactions });
      await supabase.from('message_reactions').insert({ message_id: messageId, user_id: profile.id, emoji });
    }
  }

  function handleDeleteClick(messageId: string) {
    const msg = messages.find(m => m.id === messageId);
    if (msg) setDeleteModalMsg(msg);
  }

  async function confirmDelete(forEveryone: boolean) {
    if (!deleteModalMsg) return;
    const msgId = deleteModalMsg.id;
    setDeleteModalMsg(null);
    
    if (forEveryone) {
      await supabase.from('messages').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', msgId);
      updateMessage(conversationId, msgId, { is_deleted: true });
    } else {
      const newDeleted = [...deletedLocalIds, msgId];
      setDeletedLocalIds(newDeleted);
      localStorage.setItem('deleted_messages', JSON.stringify(newDeleted));
        window.dispatchEvent(new Event('chat_cleared'));
      // Remove from store for immediate effect
      useChatStore.getState().removeMessage(conversationId, msgId);
    }
  }

  async function handleEdit(message: Message) {
    const newContent = window.prompt('Edit message:', message.content || '');
    if (newContent !== null && newContent !== message.content) {
      await supabase.from('messages').update({ content: newContent, is_edited: true }).eq('id', message.id);
      updateMessage(conversationId, message.id, { content: newContent, is_edited: true });
    }
  }

  const groupedMessages: Array<{ type: 'date'; date: Date } | { type: 'message'; message: Message; showAvatar: boolean; showSender: boolean }> = [];
  let lastDate: string | null = null;
  let lastSenderId: string | null = null;

  const visibleMessages = messages.filter(m => !deletedLocalIds.includes(m.id));
    for (let i = 0; i < visibleMessages.length; i++) {
      const msg = visibleMessages[i];
    const msgDate = new Date(msg.created_at);
    const dateKey = format(msgDate, 'yyyy-MM-dd');
    if (dateKey !== lastDate) {
      groupedMessages.push({ type: 'date', date: msgDate });
      lastDate = dateKey;
      lastSenderId = null;
    }
    groupedMessages.push({ type: 'message', message: msg, showAvatar: msg.sender_id !== lastSenderId, showSender: msg.sender_id !== lastSenderId });
    lastSenderId = msg.sender_id;
  }

  if (isLoadingMessages) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => <MessageSkeleton key={i} isOwn={i % 3 === 0} />)}
      </div>
    );
  }

  if (messages.length === 0) {
    return <div className="flex-1 flex items-center justify-center"><EmptyState variant="no-messages" /></div>;
  }

  return (
    <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4">
      {deleteModalMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#151922] w-full max-w-sm rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-[#252A34]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete message?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete this message?</p>
            <div className="flex flex-col gap-2">
              {deleteModalMsg.sender_id === profile?.id && (
                <button 
                  onClick={() => confirmDelete(true)}
                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                  Delete for everyone
                </button>
              )}
              <button 
                onClick={() => confirmDelete(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#151922] dark:hover:bg-[#2A3040] text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
              >
                Delete for me
              </button>
              <button 
                onClick={() => setDeleteModalMsg(null)}
                className="w-full py-2.5 mt-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {groupedMessages.map((item, index) => {
        if (item.type === 'date') return <DateSeparator key={`date-${index}`} date={item.date} />;
        const { message, showAvatar, showSender } = item;
        const isOwn = message.sender_id === profile?.id;
        return (
          <MessageBubble key={message.id} message={message}
              isOwn={isOwn} showAvatar={showAvatar} showSender={showSender}
            currentUserId={profile?.id || ''} onReply={setReplyToMessage} onEdit={handleEdit}
            onDelete={handleDeleteClick} onReact={handleReact}
          />
        );
      })}
      <TypingIndicator names={typingUsers.map(u => u.username)} />
      <div ref={messagesEndRef} />
    </div>
  );
}


