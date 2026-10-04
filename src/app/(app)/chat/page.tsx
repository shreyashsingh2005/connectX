'use client';

import { useUIStore } from '@/store/useUIStore';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageSquarePlus } from 'lucide-react';

export default function ChatPage() {
  const setShowNewChatModal = useUIStore(s => s.setShowNewChatModal);

  return (
    <>
      {/* Mobile: show conversation list */}
      <div className="md:hidden flex flex-col h-full">
        <ConversationList />
      </div>

      {/* Desktop: empty state */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-[#F6F7F9] dark:bg-[#0B0F12]">
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 mb-4 bg-white dark:bg-[#11161B] border border-[#EAECF0] dark:border-white/5 rounded-[12px] flex items-center justify-center shadow-sm">
            <MessageSquarePlus className="w-6 h-6 text-[#667085] dark:text-[#A7AFB8]" strokeWidth={1.5} />
          </div>
          <h2 className="text-[15px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">No conversation selected</h2>
          <p className="text-[13px] text-[#667085] dark:text-[#A7AFB8] max-w-[240px] leading-relaxed mb-6">
            Select a conversation from the sidebar or start a new chat.
          </p>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="bg-[#8B5CF6] text-white font-medium text-[13px] px-4 py-2 rounded-[8px] hover:bg-[#7C3AED] transition-colors shadow-sm"
          >
            New message
          </button>
        </div>
      </div>
    </>
  );
}

