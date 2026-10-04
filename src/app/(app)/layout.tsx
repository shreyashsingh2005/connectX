'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/useUIStore';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ConversationList } from '@/components/chat/ConversationList';
import { NewChatModal } from '@/components/modals/NewChatModal';
import { GroupChatModal } from '@/components/modals/GroupChatModal';
import { UsernameSetupModal } from '@/components/modals/UsernameSetupModal';
import { CallOverlay } from '@/components/chat/CallOverlay';
import { AppBootScreen } from '@/components/ui/AppBootScreen';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, isLoaded, updateOnlineStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const showNewChatModal = useUIStore(s => s.showNewChatModal);
  const showGroupModal = useUIStore(s => s.showGroupModal);

  const isMobileChatView = pathname.startsWith('/chat/') && pathname.length > 6;
  const isSettingsView = pathname.startsWith('/settings');
  const hideOnMobile = isMobileChatView || isSettingsView;

  useEffect(() => {
    // Wait for auth to settle
  }, [isLoaded, profile, router]);

  useEffect(() => {
    if (!profile) return;
    updateOnlineStatus(true);
    
    const handleVisibilityChange = () => updateOnlineStatus(!document.hidden);
    const handleBeforeUnload = () => updateOnlineStatus(false);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateOnlineStatus(false);
    };
  }, [profile?.id, updateOnlineStatus]);

  if (!isLoaded) {
    return <AppBootScreen />;
  }

  if (!profile) {
    return (
      <div className="h-[100dvh] w-full bg-bg-surface flex items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-[18px] font-bold text-text-main">Profile Setup Failed</h2>
          <p className="text-text-sec text-[13px]">We couldn't load your profile. This usually happens if the database triggers didn't run properly during signup.</p>
          <button 
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client');
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="mt-6 px-6 py-2 bg-bg-secondary text-text-main rounded-[12px] transition-colors"
          >
            Log Out & Try Again
          </button>
        </div>
      </div>
    );
  }

  // The requested canonical app shell structure:
  // Desktop: 3 columns grid -> AppNav (72px) | ChatSidebar (340px) | Main Content (remaining)
  // Mobile: 1 column grid -> Main Content (remaining). AppNav floats fixed at bottom.

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-bg-surface md:grid md:grid-cols-[72px_340px_minmax(0,1fr)] box-border">
      {/* COLUMN 1: App Navigation */}
      <div className="md:col-start-1 md:col-end-2 w-full md:h-[100dvh] min-w-0 min-h-0 relative z-[50]"><AppSidebar /></div>

      {/* COLUMN 2: Conversation Sidebar (Hidden on mobile) */}
      <div className="hidden md:flex flex-col h-[100dvh] overflow-hidden min-w-0 min-h-0 border-r border-border-subtle bg-bg-surface md:col-start-2 md:col-end-3 relative">
        <ConversationList />
      </div>

      {/* COLUMN 3: Main Content */}
      <main key={pathname} className={cn(
        "md:col-start-3 md:col-end-4",
        "flex flex-col min-w-0 min-h-0 h-[100dvh] overflow-hidden relative",
        hideOnMobile ? "pb-0" : "pb-[80px] md:pb-0"
      )}>
        {children}
      </main>

      {/* Modals */}
      {showNewChatModal && <NewChatModal />}
      {showGroupModal && <GroupChatModal />}
      <UsernameSetupModal />
      <CallOverlay />
    </div>
  );
}
