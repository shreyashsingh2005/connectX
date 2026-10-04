/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Conversation } from '@/types';
import { debounce } from '@/lib/utils';
import toast from 'react-hot-toast';
import { UserAvatar } from '@/components/ui/UserAvatar';
import * as E2EE from '@/lib/e2ee';
import { Message } from '@/types';

// Module-level singleton guard.
// ConversationList is rendered twice on desktop (layout sidebar + /chat page mobile view).
// Both instances call useConversations(), which would create two identical Supabase channel
// subscriptions and double-fire every INSERT handler. We prevent this by tracking how many
// instances are mounted and only creating/tearing-down the channel from the first mount.
let _activeConversationSubscribers = 0;
let _globalChannelRef: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;

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

  const loadConversations = useCallback(async (silent = false) => {
    if (!profile) return;
    if (!silent) setIsLoadingConversations(true);

    try {
      const { data: memberRows } = await supabase
        .from('conversation_members')
        .select('conversation_id, is_pinned, is_muted, is_archived, last_read_at, role, cleared_at')
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
          last_message:messages!fk_last_message(id, content, type, created_at, sender_id, is_deleted)
        `)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false });

      if (!convData) return;

      const currentConvs = useChatStore.getState().conversations;
        let clearedChats: Record<string, string> = {};
        let deletedLocalIds: string[] = [];
        try {
          clearedChats = JSON.parse(localStorage.getItem('cleared_chats') || '{}');
          deletedLocalIds = JSON.parse(localStorage.getItem('deleted_messages') || '[]');
        } catch (e) {}

        const enriched: Conversation[] = convData.map(conv => {
          const memberInfo = memberRows.find(m => m.conversation_id === conv.id);
          const otherMember = conv.type === 'direct'
            ? (conv.members as { user_id: string; profile: unknown }[]).find((m: { user_id: string }) => m.user_id !== profile.id)?.profile as Conversation['other_member']
            : undefined;
  
          let lastMsg = Array.isArray(conv.last_message) ? conv.last_message[0] : conv.last_message;
          
          if (lastMsg) {
             const clearedAt = memberInfo?.cleared_at || clearedChats[conv.id];
             if (deletedLocalIds.includes(lastMsg.id)) {
               lastMsg = undefined;
             } else if (clearedAt && new Date(lastMsg.created_at) <= new Date(clearedAt)) {
               lastMsg = undefined;
             }
          }
        
        // Preserve unread count or compute initially
        const existingConv = currentConvs.find(c => c.id === conv.id);
        const lastReadAt = new Date(memberInfo?.last_read_at || 0).getTime();
        const lastMsgAt = new Date(lastMsg?.created_at || 0).getTime();
        
        let initialUnreadCount = 0;
        if (lastMsgAt > lastReadAt && lastMsg?.sender_id !== profile.id) {
           initialUnreadCount = existingConv?.unread_count ? Math.max(1, existingConv.unread_count) : 1;
        }

        return {
          ...conv,
          other_member: otherMember,
          last_message: lastMsg,
          is_pinned: memberInfo?.is_pinned ?? false,
          is_muted: memberInfo?.is_muted ?? false,
          unread_count: initialUnreadCount,
        };
      });

      setConversations(enriched);

      // Background task: Mark all sent messages as delivered since client is connected
      setTimeout(() => {
        supabase.from('messages')
          .update({ status: 'delivered' })
          .eq('status', 'sent')
          .neq('sender_id', profile.id)
          .in('conversation_id', conversationIds)
          .then();
      }, 500);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [profile, supabase, setConversations, setIsLoadingConversations]);

  
  
  // Realtime subscription â€” singleton guard prevents duplicate channels
  useEffect(() => {
    if (!profile) return;
    loadConversations();

    _activeConversationSubscribers += 1;


    const debouncedLoad = debounce(() => {
      loadConversations(true);
    }, 1000);

    // IMPORTANT: Deterministic channel name â€” no Math.random().
    // A random suffix caused duplicate Supabase channels on every React remount/StrictMode double-invoke,
    // leading to multiple competing INSERT handlers and stale isActive state.
    const channelName = `user_conversations:${profile.id}`;
    
    if (!_globalChannelRef) {
      _globalChannelRef = supabase
        .channel(channelName)
      
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const updatedMsgRaw = payload.new as Message;
          useChatStore.getState().updateMessage(updatedMsgRaw.conversation_id, updatedMsgRaw.id, updatedMsgRaw);
          
          // If it's the last message of a conversation, update the preview
          const currentConvs = useChatStore.getState().conversations;
          const conv = currentConvs.find(c => c.id === updatedMsgRaw.conversation_id);
          if (conv && conv.last_message?.id === updatedMsgRaw.id) {
             useChatStore.getState().updateConversation(conv.id, {
               last_message: updatedMsgRaw
             });
          }
        }
      )
.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
            const newMsgRaw = payload.new as Message;
          const currentConvs = useChatStore.getState().conversations;
          const conv = currentConvs.find(c => c.id === newMsgRaw.conversation_id);
          
          if (!conv) {
            debouncedLoad();
            return;
          }

          // Decryption in realtime listener REMOVED to avoid race conditions with UI local cache

          const isOwn = newMsgRaw.sender_id === profile.id;
          const activeId = useChatStore.getState().activeConversationId;
          const isActive = activeId === conv.id;

          useChatStore.getState().updateConversation(conv.id, {
            last_message: newMsgRaw,
            last_message_at: newMsgRaw.created_at,
            unread_count: isActive || isOwn ? 0 : (conv.unread_count || 0) + 1,
          });
          
          const updatedConvs = useChatStore.getState().conversations;
          const sorted = [...updatedConvs].sort((a, b) => 
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          );
          useChatStore.getState().setConversations(sorted);

          // ALWAYS add the message to the store regardless of isActive.
          // Previously, this was gated on isActive, which silently dropped messages
          // when setActiveConversationId() had not yet fired (timing race on desktop).
          // addMessage in useChatStore deduplicates by message.id, so calling it
          // unconditionally is safe â€” duplicates from optimistic insert will be merged.
          const newMessage = {
            ...newMsgRaw,
            sender: isOwn ? undefined : (conv.type === 'direct' ? conv.other_member : undefined),
            attachments: [],
            reactions: [],
          };
          useChatStore.getState().addMessage(newMsgRaw.conversation_id, newMessage as any);

          if (isActive && !isOwn) {
            // Mark as read only when this conversation is actively open
            await supabase.from('conversation_members').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', newMsgRaw.conversation_id).eq('user_id', profile.id);
            await supabase.from('messages').update({ status: 'read' }).eq('id', newMsgRaw.id);
            try {
              (window as any).__chat_channel?.send({ type: 'broadcast', event: 'read', payload: { userId: profile.id } });
            } catch {}
          } else if (!isActive && !isOwn) {
              // Mark as delivered for non-active conversation
              await supabase.from('messages').update({ status: 'delivered' }).eq('id', newMsgRaw.id).eq('status', 'sent');

              // Show toast notification for messages in non-active conversations
            let senderName = 'Someone';
            let senderAvatar = null;
            
            if (conv.type === 'direct' && conv.other_member) {
              senderName = conv.other_member.display_name || conv.other_member.username;
              senderAvatar = conv.other_member.avatar_url;
            } else {
              const member = conv.members?.find(m => m.user_id === newMsgRaw.sender_id);
              if (member && (member.profile as any)) {
                senderName = (member.profile as any).display_name || (member.profile as any).username;
                senderAvatar = (member.profile as any).avatar_url;
              }
            }

            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-[#111827] shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer hover:bg-[#1F2937] transition-colors`}
                   onClick={() => { toast.dismiss(t.id); window.location.href = `/chat/${conv.id}`; }}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <UserAvatar src={senderAvatar} name={senderName} size="sm" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-white">{senderName}</p>
                      <p className="mt-1 text-xs text-gray-400">New message</p>
                    </div>
                  </div>
                </div>
              </div>
            ), { duration: 4000, id: `msg-${conv.id}` });
          }
        }
      )
      
      
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'attachments',
          },
          async (payload) => {
            const newAttachment = payload.new;
            const state = useChatStore.getState();
            const convMsgs = state.messages[newAttachment.conversation_id] || [];
            const msg = convMsgs.find(m => m.id === newAttachment.message_id);
            if (msg) {
              const currentAtts = msg.attachments || [];
              if (!currentAtts.some(a => a.id === newAttachment.id)) {
                state.updateMessage(newAttachment.conversation_id, newAttachment.message_id, {
                  attachments: [...currentAtts, newAttachment as any]
                });
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'message_reactions',
        },
        async (payload) => {
          // If we receive a reaction update, we need to fetch it or patch it
          const reaction = (payload.new || payload.old) as any;
          if (!reaction || !reaction.message_id) return;
          
          // Find conversation ID by searching messages (inefficient but works for active chat)
          const state = useChatStore.getState();
          let convId = null;
          let msgToUpdate = null;
          
          for (const [cId, msgs] of Object.entries(state.messages)) {
            const m = msgs.find(msg => msg.id === reaction.message_id);
            if (m) {
              convId = cId;
              msgToUpdate = m;
              break;
            }
          }
          
          if (!convId || !msgToUpdate) return;
          
          let newReactions = [...(msgToUpdate.reactions || [])];
          
          if (payload.eventType === 'INSERT') {
              const existingIdx = newReactions.findIndex(r => r.message_id === reaction.message_id && r.user_id === reaction.user_id && r.emoji === reaction.emoji);
              
              const conv = state.conversations.find(c => c.id === convId);
              let profile = undefined;
              if (conv && conv.type === 'direct' && conv.other_member?.id === reaction.user_id) {
                profile = conv.other_member;
              }
              
              if (existingIdx !== -1) {
                newReactions[existingIdx] = { ...reaction, profile } as any;
              } else {
                newReactions.push({ ...reaction, profile } as any);
              }
            } else if (payload.eventType === 'DELETE') {
              newReactions = newReactions.filter(r => !(r.message_id === payload.old.message_id && r.user_id === payload.old.user_id && r.emoji === payload.old.emoji));
            }
          
          state.updateMessage(convId, reaction.message_id, { reactions: newReactions });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_members',
          
        },
        () => {
          debouncedLoad();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const updatedProfile = payload.new;
          const currentConvs = useChatStore.getState().conversations;
          let changed = false;
          
          currentConvs.forEach(conv => {
            if (conv.type === 'direct' && conv.other_member?.id === updatedProfile.id) {
              useChatStore.getState().updateConversation(conv.id, {
                other_member: { ...conv.other_member, ...updatedProfile } as any
              });
              changed = true;
            }
          });
          
          if (changed && typeof window !== 'undefined') {
            // Trigger a react state update if needed, but Zustand updateConversation should be enough
          }
        }
      )
      .subscribe();
    }

    return () => {
      _activeConversationSubscribers -= 1;
      if (_activeConversationSubscribers <= 0) {
        setTimeout(() => {
          if (_activeConversationSubscribers <= 0 && _globalChannelRef) {
            supabase.removeChannel(_globalChannelRef);
            _globalChannelRef = null;
          }
        }, 100);
      }
    };
  }, [profile?.id, loadConversations, supabase]);



  return { conversations, isLoadingConversations, loadConversations, updateConversation, addConversation };
}

