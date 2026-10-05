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
  const { profile, isLoaded, authError, updateOnlineStatus, retryProfileLoad } = useAuth();
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
    // Dynamically choose message based on authError classification
    let title = "Couldn't load profile";
    let message = "An unexpected error occurred while loading your profile.";
    let showRetry = true;
    let isAuthError = false;

    if (authError === 'NETWORK_ERROR') {
      title = "Connection Issue";
      message = "We couldn't reach the server. Please check your internet connection and try again.";
    } else if (authError === 'AUTH_SESSION_ERROR') {
      title = "Session Expired";
      message = "Your authentication session has expired or is invalid. Please sign in again.";
      isAuthError = true;
      showRetry = false;
    } else if (authError === 'PROFILE_BOOTSTRAP_ERROR') {
      title = "Profile Setup Incomplete";
      message = "We encountered an issue finishing your profile setup. Please try again.";
    } else if (authError === 'PROFILE_FETCH_ERROR') {
      title = "Unable to load profile";
      message = "We're having trouble retrieving your profile data right now.";
    } else if (authError === 'PROFILE_NOT_FOUND') {
      title = "Profile Not Found";
      message = "Your profile could not be located in the system.";
    }

    return (
      <div className="h-[100dvh] w-full bg-bg-surface flex items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border border-border-subtle">
            <svg className="w-8 h-8 text-text-sec" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          
          <div>
            <h2 className="text-[20px] font-bold text-text-main mb-2">{title}</h2>
            <p className="text-text-sec text-[14px] leading-relaxed max-w-[300px] mx-auto">{message}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {showRetry && (
              <button 
                onClick={() => retryProfileLoad()}
                className="w-full sm:w-auto px-6 py-2.5 bg-brand text-white font-medium rounded-[11px] hover:bg-brand-dark transition-colors shadow-sm"
              >
                Try Again
              </button>
            )}
            
            <button 
              onClick={async () => {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-transparent border border-border-subtle text-text-sec font-medium rounded-[11px] hover:text-text-main hover:bg-bg-secondary transition-colors"
            >
              {isAuthError ? 'Sign In Again' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-bg-surface md:grid md:grid-cols-[72px_320px_minmax(0,1fr)] lg:grid-cols-[72px_340px_minmax(0,1fr)] box-border">
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
        hideOnMobile ? "pb-0" : "pb-[calc(58px+env(safe-area-inset-bottom))] md:pb-0"
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
