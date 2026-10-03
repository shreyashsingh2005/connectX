'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification } from '@/types';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Bell, Check, Loader2, MessageSquare, AlertCircle, Phone, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const router = useRouter();

  useEffect(() => {
    if (!profile) return;
    loadNotifications();

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, 
        (payload) => {
          // Skip friend relationship notifications
          const isFriendEvent = payload.new && ('type' in payload.new) && 
            (payload.new.type === 'friend_request' || payload.new.type === 'friend_accept');
            
          if (isFriendEvent) return;
          
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev.filter(n => n.id !== payload.new.id)]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? (payload.new as Notification) : n));
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, supabase]);

  // Mark all unread as read immediately upon load
  useEffect(() => {
    if (notifications.length > 0 && notifications.some(n => !n.is_read)) {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      supabase.from('notifications').update({ is_read: true }).in('id', unreadIds).then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      });
    }
  }, [notifications.length, supabase]);

  async function loadNotifications() {
    if (!profile) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .not('type', 'in', '("friend_request","friend_accept")')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setNotifications(data || []);
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className="text-[#EC4899]" />;
      case 'call': return <Phone size={16} className="text-[#8B5CF6]" />;
      case 'system': return <Info size={16} className="text-[#F59E0B]" />;
      default: return <Bell size={16} className="text-[#667085] dark:text-[#98A2B3]" />;
    }
  };

  const today = notifications.filter(n => isToday(new Date(n.created_at)));
  const yesterday = notifications.filter(n => isYesterday(new Date(n.created_at)));
  const earlier = notifications.filter(n => !isToday(new Date(n.created_at)) && !isYesterday(new Date(n.created_at)));

  const NotificationCard = ({ n }: { n: Notification }) => {
    const isUnread = !n.is_read;
    const hasAvatar = !!n.data?.sender_avatar || !!n.data?.sender_name;
    
    return (
      <div 
        onClick={() => {
          const targetId = n.data?.sender_id || n.data?.conversation_id;
          if (targetId && n.type === 'message') router.push(`/chat/${targetId}`);
        }}
        className={cn(
          "flex items-center gap-3 p-3 h-auto min-h-[64px] rounded-[14px] border transition-all cursor-pointer group",
          isUnread 
            ? "bg-[#FFFFFF] dark:bg-[#151922] border-[#8B5CF6]/30 dark:border-[#8B5CF6]/30 shadow-sm" 
            : "bg-transparent border-transparent hover:bg-[#FFFFFF] dark:hover:bg-[#11141A] hover:border-[#EAECF0] dark:hover:border-[#252A34]"
        )}
      >
        <div className="flex-shrink-0 relative">
          {isUnread && (
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#8B5CF6] border-2 border-white dark:border-[#151922] z-10" />
          )}
          {hasAvatar ? (
            <UserAvatar 
              src={(n.data?.sender_avatar as string) || undefined} 
              name={(n.data?.sender_name as string) || 'User'} 
              size="sm" 
              className="w-[36px] h-[36px]" 
            />
          ) : (
            <div className="w-[36px] h-[36px] bg-[#F8FAFC] dark:bg-[#1A1E29] rounded-full border border-[#EAECF0] dark:border-[#252A34] flex items-center justify-center">
              {getIcon(n.type)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-2">
            <h3 className={cn("text-[13px] font-semibold truncate", isUnread ? "text-[#101828] dark:text-[#F5F7FA]" : "text-[#344054] dark:text-[#D0D5DD]")}>
              {n.title}
            </h3>
            <span className="text-[11px] font-medium text-[#98A2B3] flex-shrink-0">
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: false }).replace('about ', '')}
            </span>
          </div>
          {n.body && (
            <p className={cn("text-[13px] truncate", isUnread ? "text-[#344054] dark:text-[#D0D5DD]" : "text-[#667085] dark:text-[#98A2B3]")}>
              {n.body}
            </p>
          )}
        </div>
      </div>
    );
  };

  const SkeletonLoaders = () => (
    <div className="space-y-1">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 min-h-[64px] rounded-[14px] bg-transparent">
          <div className="w-[36px] h-[36px] rounded-full bg-gray-200 dark:bg-[#1A1E29] animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="flex justify-between items-center">
              <div className="w-24 h-3 bg-gray-200 dark:bg-[#1A1E29] rounded animate-pulse" />
              <div className="w-8 h-2 bg-gray-200 dark:bg-[#1A1E29] rounded animate-pulse" />
            </div>
            <div className="w-48 h-3 bg-gray-200 dark:bg-[#1A1E29] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 z-10 overflow-hidden relative bg-[#F8FAFC] dark:bg-[#0B0D12]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="mb-8">
            <h1 className="text-[24px] md:text-[28px] font-bold text-[#101828] dark:text-[#F5F7FA] tracking-tight">Notifications</h1>
            <p className="text-[14px] text-[#667085] dark:text-[#98A2B3] mt-1">Stay up to date with your activity.</p>
          </div>

          {isLoading ? (
            <SkeletonLoaders />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-8 h-8 text-[#F97066] mb-3" strokeWidth={1.5} />
              <p className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA] mb-1">Couldn't load notifications</p>
              <button onClick={loadNotifications} className="text-[13px] font-medium text-[#8B5CF6] hover:text-[#7C3AED] transition-colors outline-none">
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 bg-white dark:bg-[#11141A] rounded-full flex items-center justify-center mb-4 border border-[#EAECF0] dark:border-[#252A34] shadow-sm">
                <Bell className="w-5 h-5 text-[#98A2B3]" strokeWidth={1.75} />
              </div>
              <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">You're all caught up</h3>
              <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">No new notifications right now.</p>
            </div>
          ) : (
            <div className="space-y-6 pb-10">
              {today.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-[12px] font-bold text-[#98A2B3] uppercase tracking-wider mb-2 ml-1">Today</h2>
                  <div className="space-y-1">
                    {today.map(n => <NotificationCard key={n.id} n={n} />)}
                  </div>
                </section>
              )}
              
              {yesterday.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
                  <h2 className="text-[12px] font-bold text-[#98A2B3] uppercase tracking-wider mb-2 ml-1">Yesterday</h2>
                  <div className="space-y-1">
                    {yesterday.map(n => <NotificationCard key={n.id} n={n} />)}
                  </div>
                </section>
              )}
              
              {earlier.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
                  <h2 className="text-[12px] font-bold text-[#98A2B3] uppercase tracking-wider mb-2 ml-1">Earlier</h2>
                  <div className="space-y-1">
                    {earlier.map(n => <NotificationCard key={n.id} n={n} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
