'use client';

import { Conversation } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatLastSeen, cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';
import { useWebRTC } from '@/hooks/useWebRTC';
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
  const { startCall } = useWebRTC();
  const [showMenu, setShowMenu] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const { setChatOverride, chatOverrides } = useThemeStore();
  const [showClearModal, setShowClearModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleClearChat() {
    if (!profile) return;
    try {
      const clearedChats = JSON.parse(localStorage.getItem('cleared_chats') || '{}');
      clearedChats[conversation.id] = new Date().toISOString();
      localStorage.setItem('cleared_chats', JSON.stringify(clearedChats));
      window.dispatchEvent(new Event('chat_cleared'));
      
      useChatStore.getState().setMessages(conversation.id, []);
      
      toast.success('Chat cleared for you');
      setShowClearModal(false);
    } catch (error) {
      toast.error('Failed to clear chat');
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
    <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-[#252A34] bg-white/80 dark:bg-[#0B0D12]/80 backdrop-blur-xl flex-shrink-0 min-h-[64px]">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/chat')}
          className="md:hidden w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={toggleProfilePanel}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-[36px] h-[36px] md:w-[42px] md:h-[42px] relative flex-shrink-0">
            <UserAvatar
              src={avatarUrl}
              name={name}
              className="w-full h-full text-sm"
              isOnline={isDirect ? isOnline : undefined}
            />
          </div>
          <div className="text-left flex flex-col justify-center">
            <h3 className="font-semibold text-gray-900 dark:text-white text-[15px] leading-tight">{name}</h3>
            {isDirect ? (
              <div className="flex items-center gap-1.5 mt-[2px]">
                <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600")} />
                <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
                  {isOnline ? 'Online' : (lastSeen ? formatLastSeen(lastSeen) : 'Offline')}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-[2px]">
                <Users className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[13px] text-gray-500">{memberCount} members</span>
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
                if (otherMember) startCall(otherMember.id, conversation.id, 'audio');
              }}
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[#667085] dark:text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA] hover:bg-[#F9FAFB] dark:hover:bg-[#1A1E29] transition-colors"
            >
              <Phone className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
            <button
              title="Video call"
              onClick={() => {
                const otherMember = conversation.members?.find(m => m.user_id !== profile?.id)?.profile;
                if (otherMember) startCall(otherMember.id, conversation.id, 'video');
              }}
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[#667085] dark:text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA] hover:bg-[#F9FAFB] dark:hover:bg-[#1A1E29] transition-colors"
            >
              <Video className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
          </>
        )}
        <div className="relative" ref={menuRef}>
          <button
            title="More options"
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1E29] transition-colors relative"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#151922] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
              <button 
                onClick={() => { setShowMenu(false); toggleProfilePanel(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors"
              >
                Conversation Info
              </button>
              <div className="h-[1px] w-full bg-gray-100 dark:bg-gray-700" />
              <button 
                onClick={() => { setShowMenu(false); setShowClearModal(true); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Clear Chat
              </button>
            </div>
          )}
        </div>
        
        {showClearModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-[#151922] w-full max-w-sm rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-[#252A34]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Clear chat?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to clear all messages in this conversation? This will only clear them for you.</p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleClearChat}
                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                  Clear chat
                </button>
                <button 
                  onClick={() => setShowClearModal(false)}
                  className="w-full py-2.5 mt-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
    {showThemePicker && <ChatThemePicker conversationId={conversation.id} onClose={() => setShowThemePicker(false)} />}
    </>
  );
}
