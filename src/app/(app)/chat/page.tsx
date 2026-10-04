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
      <div className="hidden md:flex flex-1 items-center justify-center bg-[#F6F7F9] dark:bg-bg-primary">
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 mb-4 bg-bg-surface border border-border-subtle border-border-subtle rounded-[12px] flex items-center justify-center shadow-sm">
            <MessageSquarePlus className="w-6 h-6 text-text-sec" strokeWidth={1.5} />
          </div>
          <h2 className="text-[15px] font-semibold text-text-main mb-1">No conversation selected</h2>
          <p className="text-[13px] text-text-sec max-w-[240px] leading-relaxed mb-6">
            Select a conversation from the sidebar or start a new chat.
          </p>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="bg-brand text-white font-medium text-[13px] px-4 py-2 rounded-[8px] hover:bg-brand-dark transition-colors shadow-sm"
          >
            New message
          </button>
        </div>
      </div>
    </>
  );
}

