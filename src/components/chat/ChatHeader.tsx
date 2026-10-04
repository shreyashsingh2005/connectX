'use client';

import { Conversation } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatLastSeen, cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';
import { useCallStore } from '@/store/useCallStore';
import { Palette } from 'lucide-react';
import { ChatThemePicker } from '@/components/chat/ChatThemePicker';
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/store/useChatStore';
import toast from 'react-hot-toast';

interface ChatHeaderProps {
  conversation: Conversation;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const router = useRouter();
  const profile = useAuthStore(s => s.profile);
  const toggleProfilePanel = useUIStore(s => s.toggleProfilePanel);
  const startCall = useCallStore(s => s.startCallFn);
  const [showMenu, setShowMenu] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const { setChatOverride, chatOverrides } = useThemeStore();
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Temporarily removed outside click handling for debugging
  }, []);

  useEffect(() => {
    console.log("CLEAR_CHAT_MODAL_STATE", showClearModal);
  }, [showClearModal]);

  const handleOpenClearChat = () => {
    console.log("CLEAR_CHAT_CLICK_WORKS");
    setShowMenu(false);
    setShowClearModal(true);
  };

  async function handleClearChat() {
    if (isClearing) return;
    setIsClearing(true);
    if (!profile) return;
    try {
      const { error } = await supabase.rpc('clear_conversation_for_current_user', {
        conversation_id: conversation.id
      });
      if (error) throw error;
      
      const clearedChats = JSON.parse(localStorage.getItem('cleared_chats') || '{}');
      clearedChats[conversation.id] = new Date().toISOString();
      localStorage.setItem('cleared_chats', JSON.stringify(clearedChats));
      
      useChatStore.getState().setMessages(conversation.id, []);
      useChatStore.getState().updateConversation(conversation.id, { unread_count: 0, cleared_at: new Date().toISOString() });
      
      console.log('[CLEAR_CHAT] RPC_SUCCESS');
      toast.success('Chat cleared');
      setShowClearModal(false);
      setShowMenu(false);
    } catch (error) {
      console.error(error);
      toast.error("Couldn't clear chat. Please try again.");
    } finally {
      setIsClearing(false);
    }
  }

  const isDirect = conversation.type === 'direct';
  const name = isDirect
    ? conversation.other_member?.display_name || 'Unknown'
    : conversation.name || 'Group';
  const avatarUrl = isDirect ? conversation.other_member?.avatar_url : conversation.avatar_url;
  const isOnline = isDirect ? conversation.other_member?.is_online ?? false : false;
  const lastSeen = conversation.other_member?.last_seen;
  const memberCount = conversation.members?.length || 0;

  return (
    <>
    <header className="flex items-center justify-between px-5 py-2 border-b border-border-subtle bg-bg-surface/80 dark:bg-bg-primary/80 backdrop-blur-[18px] flex-shrink-0 h-[56px] md:h-[60px] min-h-[56px] md:min-h-[60px] relative z-50 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/chat')}
          className="md:hidden w-10 h-10 flex items-center justify-center text-text-sec hover:text-text-main transition-colors"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={toggleProfilePanel}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-[38px] h-[38px] md:w-[40px] md:h-[40px] relative flex-shrink-0">
            <UserAvatar
              src={avatarUrl}
              name={name}
              className="w-full h-full text-[13px]"
              isOnline={isDirect ? isOnline : undefined}
            />
          </div>
          <div className="text-left flex flex-col justify-center">
            <h3 className="font-[650] text-text-main text-[14px] md:text-[15px] leading-tight">{name}</h3>
            {isDirect ? (
              <div className="flex items-center gap-1.5 mt-[2px]">
                <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600")} />
                <span className="text-[12px] font-medium text-text-muted dark:text-[#737C86]">
                  {isOnline ? 'Online' : (lastSeen ? formatLastSeen(lastSeen) : 'Offline')}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-[2px]">
                <Users className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-[13px] text-text-muted">{memberCount} members</span>
              </div>
            )}
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {conversation.type !== 'group' && (
          <>
            <button
              title="Audio call"
              onClick={() => {
                const otherMember = conversation.members?.find(m => m.user_id !== profile?.id)?.profile;
                if (otherMember) startCall?.(otherMember.id, conversation.id, 'audio');
              }}
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-text-sec hover:text-text-main dark:hover:text-text-main hover:bg-bg-secondary transition-colors"
            >
              <Phone className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
            <button
              title="Video call"
              onClick={() => {
                const otherMember = conversation.members?.find(m => m.user_id !== profile?.id)?.profile;
                if (otherMember) startCall?.(otherMember.id, conversation.id, 'video');
              }}
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-text-sec hover:text-text-main dark:hover:text-text-main hover:bg-bg-secondary transition-colors"
            >
              <Video className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
          </>
        )}
        <div className="relative" ref={menuRef}>
          <button
            title="More options"
            onClick={() => setShowMenu(!showMenu)}
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-text-sec hover:bg-bg-secondary transition-colors relative"
          >
            <MoreVertical className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-bg-surface border border-border-subtle rounded-[16px] shadow-lg z-50 overflow-hidden">
              <button 
                onClick={() => { setShowMenu(false); toggleProfilePanel(); }}
                className="w-full text-left px-4 py-3 text-[13px] font-medium text-text-sec dark:text-text-main hover:bg-bg-secondary transition-colors"
              >
                Conversation Info
              </button>
              <div className="h-[1px] w-full bg-gray-100 dark:bg-bg-surface/5" />
              <button 
  type="button"
  onClick={handleOpenClearChat}
  className="w-full text-left px-4 py-3 text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"
  style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 60 }}
>
  Clear Chat
</button>
            </div>
          )}
        </div>
        
        {showClearModal && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-bg-surface w-full max-w-sm rounded-[16px] p-6 shadow-xl border border-border-subtle">
              <h3 className="text-[16px] font-semibold text-text-main mb-2">Clear chat?</h3>
              <p className="text-[13px] text-text-muted mb-6">Are you sure you want to clear all messages in this conversation? This will only clear them for you.</p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={(e) => {
                    console.log('[CLEAR_CHAT] CONFIRM');
                    handleClearChat();
                  }}
                  disabled={isClearing}
                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-[12px] font-medium transition-colors"
                >
                  {isClearing ? 'Clearing...' : 'Clear chat'}
                </button>
                <button 
                  onClick={() => setShowClearModal(false)}
                  className="w-full py-2.5 mt-2 text-text-muted hover:text-text-sec dark:text-text-muted dark:hover:text-text-muted rounded-[12px] font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </header>
    {showThemePicker && <ChatThemePicker conversationId={conversation.id} onClose={() => setShowThemePicker(false)} />}
    </>
  );
}
