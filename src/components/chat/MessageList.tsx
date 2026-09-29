'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageBubble } from './MessageBubble';
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
      <div className="flex-1 h-px bg-gray-200 dark:bg-[#1F2937]" />
      <span className="text-xs text-gray-500 font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-[#1F2937]" />
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
  const prependMessages = useChatStore(s => s.prependMessages);
  const setIsLoadingMessages = useChatStore(s => s.setIsLoadingMessages);
  const setReplyToMessage = useChatStore(s => s.setReplyToMessage);
  const addTypingUser = useChatStore(s => s.addTypingUser);
  const removeTypingUser = useChatStore(s => s.removeTypingUser);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const oldestMessageIdRef = useRef<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [latestLocalMessageId, setLatestLocalMessageId] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const loadMessages = useCallback(async (beforeId?: string) => {
    if (!conversationId) return;
    if (!beforeId) setIsLoadingMessages(true);
    else setIsLoadingMore(true);
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

      const ordered = [...data].reverse();
      setHasMore(data.length === PAGE_SIZE);

      if (!beforeId) {
        setMessages(conversationId, ordered);
        if (ordered.length > 0) oldestMessageIdRef.current = ordered[0].id;
        if (ordered.length > 0 && !beforeId) setLatestLocalMessageId(ordered[ordered.length - 1].id);
      } else {
        prependMessages(conversationId, ordered);
        if (ordered.length > 0) oldestMessageIdRef.current = ordered[0].id;
      }

      if (profile) {
        await supabase.from('conversation_members').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', conversationId).eq('user_id', profile.id);
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
      const last = messages[messages.length - 1];
      if (last.sender_id === profile?.id) scrollToBottom();
    }
  }, [messages.length]);

  useEffect(() => {
    if (!conversationId || !profile) return;

    
    const channel = supabase
      .channel(`messages:${conversationId}:${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          setLatestLocalMessageId(payload.new.id);
          const { data } = await supabase.from('messages').select('*, sender:profiles(id, username, display_name, avatar_url), attachments(*), reactions:message_reactions(*)').eq('id', payload.new.id).single();
          if (data && data.sender_id !== profile.id) {
            addMessage(conversationId, data);
            scrollToBottom();
            await supabase.from('conversation_members').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', conversationId).eq('user_id', profile.id);
          }
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => { updateMessage(conversationId, payload.new.id, payload.new); }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== profile.id) {
          addTypingUser({ userId: payload.userId, username: payload.username, conversationId });
          setTimeout(() => removeTypingUser(payload.userId, conversationId), 3000);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
        removeTypingUser(payload.userId, conversationId);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
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
    const existing = messages.find(m => m.id === messageId)?.reactions?.find(r => r.emoji === emoji && r.user_id === profile.id);
    if (existing) {
      await supabase.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', profile.id).eq('emoji', emoji);
    } else {
      await supabase.from('message_reactions').insert({ message_id: messageId, user_id: profile.id, emoji });
    }
    loadMessages();
  }

  async function handleDelete(messageId: string) {
    await supabase.from('messages').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', messageId);
    updateMessage(conversationId, messageId, { is_deleted: true });
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

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
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
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {groupedMessages.map((item, index) => {
        if (item.type === 'date') return <DateSeparator key={`date-${index}`} date={item.date} />;
        const { message, showAvatar, showSender } = item;
        const isOwn = message.sender_id === profile?.id;
        return (
          <MessageBubble
            key={message.id} message={message} isOwn={isOwn} showAvatar={showAvatar} showSender={showSender}
            currentUserId={profile?.id || ''} onReply={setReplyToMessage} onEdit={handleEdit}
            onDelete={handleDelete} onReact={handleReact}
          />
        );
      })}
      <TypingIndicator names={typingUsers.map(u => u.username)} />
      <div ref={messagesEndRef} />
    </div>
  );
}
