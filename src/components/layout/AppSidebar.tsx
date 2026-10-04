'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Users,
  Bell,
  Settings,
  LogOut,
  Search,
} from 'lucide-react';

const navItems = [
  { href: '/chat', icon: MessageSquare, label: 'Chats' },
  { href: '/contacts', icon: Users, label: 'Friends' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
];

export function AppSidebar() {
  const pathname = usePathname();
  // Hide bottom bar on mobile if we are inside a specific chat conversation or settings
  const isMobileChatView = pathname.startsWith('/chat/') && pathname.length > 6;
  const isSettingsView = pathname.startsWith('/settings');
  const hideOnMobile = isMobileChatView || isSettingsView;
  const router = useRouter();
  const profile = useAuthStore(s => s.profile);
  const supabase = createClient();

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (!profile) return;
    
    const fetchCounts = async () => {
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false)
        .not('type', 'in', '("friend_request","friend_accept")');
        
      setUnreadCount(notifCount || 0);

      const { count: reqCount } = await supabase
        .from('friend_requests')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', profile.id)
        .eq('status', 'pending');
        
      setPendingRequests(reqCount || 0);
    };

    fetchCounts();

    const notifChannel = supabase
      .channel(`sidebar_notifications:${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, fetchCounts)
      .subscribe();

    const reqChannel = supabase
      .channel(`sidebar_requests:${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${profile.id}` }, fetchCounts)
      .subscribe();

    return () => { 
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(reqChannel); 
    };
  }, [profile?.id, supabase]);

  async function handleLogout() {
    try {
      await supabase.from('profiles').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', profile?.id ?? '');
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      toast.error('Failed to logout');
    }
  }

  return (
    <aside className={cn(
        "flex-shrink-0 z-[100] transition-transform duration-150",
        // Desktop: static flex child of the grid column
        "md:static md:w-full md:h-full md:flex md:flex-col md:items-center md:pt-5 md:pb-6 md:bg-bg-surface md:border-r md:border-border-subtle md:rounded-none md:shadow-none md:translate-y-0 md:inset-auto",
        // Mobile: fixed bottom nav
        "fixed bottom-[12px] left-[12px] right-[12px] h-[58px] flex flex-row items-center justify-between px-4 rounded-[20px] bg-bg-surface/90 dark:bg-[rgba(20,25,30,0.82)] backdrop-blur-[18px] border border-border-subtle shadow-lg",
        hideOnMobile ? "translate-y-[150%] hidden md:flex" : "translate-y-0 flex"
      )}>
      {/* Logo */}
      <Link href="/chat" className="hidden md:flex mb-6 transition-transform hover:opacity-80" aria-label="connectX home">
        <ConnectXLogo size={28} />
      </Link>

      {/* Nav items */}
      <nav className="flex flex-row md:flex-col items-center justify-between md:justify-start w-full md:w-auto md:gap-2 md:flex-1 md:mt-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
              key={href}
              href={href}
              aria-label={label}
              
              className={cn(
                'relative group w-[42px] h-[42px] rounded-[12px] flex items-center justify-center transition-all duration-150',
                isActive
                  ? 'text-brand bg-brand-soft'
                  : 'text-text-sec hover:text-text-main dark:hover:text-text-main hover:bg-[#F1F3F5] dark:hover:bg-[rgba(255,255,255,0.06)]'
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
              
              {label === 'Notifications' && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#FFFFFF] dark:border-[#090B10] shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
              
              {label === 'Friends' && pendingRequests > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-[#F04438] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#FFFFFF] dark:border-[#090B10] shadow-sm">
                  {pendingRequests > 9 ? '9+' : pendingRequests}
                </div>
              )}
              
              {/* Tooltip */}
              <span className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#17151F] dark:bg-white text-white dark:text-[#17151F] text-[12px] font-medium rounded-[6px] px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[9999] shadow-sm translate-x-[-4px] group-hover:translate-x-0 min-w-max border border-transparent dark:border-border-subtle">
                {label}
              </span>
            </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="hidden md:block">
                  {label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        
        {/* Profile avatar (Mobile) */}
        <Link
          href="/settings"
          aria-label="Settings"
          
          className="md:hidden relative group transition-transform duration-150 active:scale-95"
        >
          <UserAvatar
            src={profile?.avatar_url}
            name={profile?.display_name || 'User'}
            size="sm"
            className={cn("rounded-full border-2", pathname.startsWith('/settings') ? "border-[#8B5CF6]" : "border-transparent")}
          />
        </Link>
      </nav>

      {/* Bottom: Settings + Profile (Desktop) */}
      <div className="hidden md:flex flex-col items-center gap-2 md:mb-2">
        <Link
          href="/settings"
          aria-label="Settings"
          
          className={cn(
            'relative group w-[42px] h-[42px] rounded-[12px] flex items-center justify-center transition-all duration-150',
            pathname.startsWith('/settings')
              ? 'text-brand bg-brand-soft'
              : 'text-text-sec hover:text-text-main dark:hover:text-text-main hover:bg-[#F1F3F5] dark:hover:bg-[rgba(255,255,255,0.06)]'
          )}
        >
          <Settings size={18} strokeWidth={2} />
          <span className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#17151F] dark:bg-white text-white dark:text-[#17151F] text-[12px] font-medium rounded-[6px] px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[9999] shadow-sm translate-x-[-4px] group-hover:translate-x-0 min-w-max border border-transparent dark:border-border-subtle">
            Settings
          </span>
        </Link>

        <button
          onClick={handleLogout}
          aria-label="Logout"
          
          className="relative group w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-text-sec hover:text-text-main dark:hover:text-text-main hover:bg-[#F1F3F5] dark:hover:bg-[rgba(255,255,255,0.06)] transition-all duration-150"
        >
          <LogOut size={18} strokeWidth={2} />
          <span className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#17151F] dark:bg-white text-white dark:text-[#17151F] text-[12px] font-medium rounded-[6px] px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[9999] shadow-sm translate-x-[-4px] group-hover:translate-x-0 min-w-max border border-transparent dark:border-border-subtle">
            Logout
          </span>
        </button>

        {/* Profile avatar (Desktop) */}
        <Link
          href="/settings"
          aria-label="Settings"
          
          className="mt-2 relative group transition-opacity duration-150 hover:opacity-80"
        >
          <UserAvatar
            src={profile?.avatar_url}
            name={profile?.display_name || 'User'}
            size="sm"
            className="rounded-full"
          />
        </Link>
      </div>
    </aside>
  );
}
