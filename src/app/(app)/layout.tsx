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
  const isMobileChatView = pathname.startsWith('/chat/') && pathname.length > 6;
  const isSettingsView = pathname.startsWith('/settings');
  const hideOnMobile = isMobileChatView || isSettingsView;
  const showNewChatModal = useUIStore(s => s.showNewChatModal);
  const showGroupModal = useUIStore(s => s.showGroupModal);

  useEffect(() => {
    // If auth is loaded but we still don't have a profile after 2 seconds, 
    // we don't automatically redirect if there's a session to avoid infinite loops.
    // Instead we let the UI show an error state if needed.
  }, [isLoaded, profile, router]);

  // Update online status
  useEffect(() => {
    if (!profile) return;
    updateOnlineStatus(true);
    
    const handleVisibilityChange = () => {
      updateOnlineStatus(!document.hidden);
    };
    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };
    
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
      <div className="h-screen w-screen bg-[#F7F8FC] dark:bg-[#0B0D12] flex items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Setup Failed</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">We couldn't load your profile. This usually happens if the database triggers didn't run properly during signup, or Row Level Security is blocking access.</p>
          <button 
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client');
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="mt-6 px-6 py-2 bg-gray-200 dark:bg-[#151922] hover:bg-gray-300 dark:bg-[#374151] text-gray-900 dark:text-white rounded-xl transition-colors"
          >
            Log Out & Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen flex flex-col-reverse md:flex-row overflow-hidden bg-[#F7F8FC] dark:bg-[#0B0D12]">
      {/* Navigation sidebar (Bottom on mobile, left on desktop) */}
      <AppSidebar />

      {/* Conversation list - hidden on mobile when chat is open */}
      <div className="hidden md:flex page-transition-enter" style={{ animationDelay: "50ms" }}>
        <ConversationList />
      </div>

      {/* Main content */}
      <main key={pathname} className={cn("flex-1 flex flex-col min-w-0 overflow-hidden md:pb-0 page-transition-enter", hideOnMobile ? "pb-0" : "pb-[80px]")}>
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

