'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Conversation } from '@/types';
import { debounce } from '@/lib/utils';

export function useConversations() {
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const {
    conversations,
    setConversations,
    updateConversation,
    addConversation,
    isLoadingConversations,
    setIsLoadingConversations,
  } = useChatStore();

  const loadConversations = useCallback(async () => {
    if (!profile) return;
    setIsLoadingConversations(true);

    try {
      const { data: memberRows } = await supabase
        .from('conversation_members')
        .select('conversation_id, is_pinned, is_muted, is_archived, last_read_at, role')
        .eq('user_id', profile.id)
        .eq('is_archived', false);

      if (!memberRows || memberRows.length === 0) {
        setConversations([]);
        return;
      }

      const conversationIds = memberRows.map(r => r.conversation_id);

      const { data: convData } = await supabase
        .from('conversations')
        .select(`
          *,
          members:conversation_members(
            user_id, role,
            profile:profiles(id, username, display_name, avatar_url, is_online, last_seen)
          ),
          last_message:messages(id, content, type, created_at, sender_id, is_deleted)
        `)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false })
        .limit(1, { foreignTable: 'messages' });

      if (!convData) return;

      const enriched: Conversation[] = convData.map(conv => {
        const memberInfo = memberRows.find(m => m.conversation_id === conv.id);
        const otherMember = conv.type === 'direct'
          ? (conv.members as { user_id: string; profile: unknown }[]).find((m: { user_id: string }) => m.user_id !== profile.id)?.profile as Conversation['other_member']
          : undefined;

        const lastMsg = Array.isArray(conv.last_message) ? conv.last_message[0] : conv.last_message;

        return {
          ...conv,
          other_member: otherMember,
          last_message: lastMsg,
          is_pinned: memberInfo?.is_pinned ?? false,
          is_muted: memberInfo?.is_muted ?? false,
        };
      });

      setConversations(enriched);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [profile, supabase, setConversations, setIsLoadingConversations]);

  // Realtime subscription
  useEffect(() => {
    if (!profile) return;
    loadConversations();

    const debouncedLoad = debounce(() => {
      loadConversations();
    }, 1000);

    const channelName = `conversations:${profile.id}:${Math.random().toString(36).substring(7)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          debouncedLoad();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          debouncedLoad();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, loadConversations, supabase]);

  return { conversations, isLoadingConversations, loadConversations, updateConversation, addConversation };
}
