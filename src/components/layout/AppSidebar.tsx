'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { ConnectXLogo } from '@/components/ui/ConnectXLogo';
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
    <aside className={cn("md:flex flex-row md:flex-col items-center justify-between md:justify-start w-full md:w-[68px] h-[64px] md:h-full bg-white/80 dark:bg-[#0E1015]/80 backdrop-blur-xl border-t md:border-t-0 md:border-r border-gray-200/50 dark:border-[#252A34] py-2 md:py-6 flex-shrink-0 z-[100] fixed bottom-0 left-0 md:relative px-6 md:px-0 transition-transform duration-300", hideOnMobile ? "translate-y-full md:translate-y-0 hidden md:flex" : "translate-y-0 flex")}>
      {/* Logo */}
      <Link href="/chat" className="hidden md:flex mb-6 transition-transform hover:opacity-80" aria-label="connectX home">
        <ConnectXLogo size={28} />
      </Link>

      {/* Nav items */}
      <nav className="flex flex-row md:flex-col items-center justify-between md:justify-start w-full md:w-auto md:gap-2 md:flex-1 md:mt-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={cn(
                'relative group w-10 h-10 rounded-[8px] flex items-center justify-center transition-all duration-300',
                isActive
                  ? 'bg-[#A855F7]/15 text-[#8B5CF6] dark:text-[#A78BFA] '
                  : 'text-[#667085] hover:text-[#344054] dark:hover:text-[#F5F7FA] hover:bg-gray-100 dark:hover:bg-[#151922]'
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
              
              {/* Tooltip */}
              <span className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-[#F5F7FA] text-white dark:text-gray-900 text-xs font-medium rounded-md px-2.5 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-sm translate-x-[-4px] group-hover:translate-x-0">
                {label}
              </span>
            </Link>
          );
        })}
        
        {/* Profile avatar (Mobile) */}
        <Link
          href="/profile"
          aria-label="My Profile"
          title="My Profile"
          className="md:hidden relative group transition-transform duration-300 active:scale-95"
        >
          <UserAvatar
            src={profile?.avatar_url}
            name={profile?.display_name || 'User'}
            size="sm"
            className={cn("rounded-full border-2", pathname.startsWith('/profile') ? "border-[#8B5CF6]" : "border-transparent")}
          />
        </Link>
      </nav>

      {/* Bottom: Settings + Profile (Desktop) */}
      <div className="hidden md:flex flex-col items-center gap-2 md:mb-2">
        <Link
          href="/settings"
          aria-label="Settings"
          title="Settings"
          className={cn(
            'relative group w-10 h-10 rounded-[8px] flex items-center justify-center transition-all duration-150',
            pathname.startsWith('/settings')
              ? 'bg-[#A855F7]/10 text-[#8B5CF6] dark:text-[#A78BFA]'
              : 'text-[#667085] hover:text-[#344054] dark:hover:text-[#F5F7FA] hover:bg-gray-100 dark:hover:bg-[#151922]'
          )}
        >
          <Settings size={18} strokeWidth={2} />
          <span className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-[#F5F7FA] text-white dark:text-gray-900 text-xs font-medium rounded-md px-2.5 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-sm translate-x-[-4px] group-hover:translate-x-0">
            Settings
          </span>
        </Link>

        <button
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
          className="relative group w-10 h-10 rounded-[8px] flex items-center justify-center text-[#667085] hover:text-[#F04438] hover:bg-red-50 dark:hover:bg-[#F04438]/10 transition-all duration-150"
        >
          <LogOut size={18} strokeWidth={2} />
          <span className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-[#F5F7FA] text-white dark:text-gray-900 text-xs font-medium rounded-md px-2.5 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-sm translate-x-[-4px] group-hover:translate-x-0">
            Logout
          </span>
        </button>

        {/* Profile avatar (Desktop) */}
        <Link
          href="/profile"
          aria-label="My Profile"
          title="My Profile"
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

