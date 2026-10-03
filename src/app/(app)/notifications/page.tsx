'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification } from '@/types';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Bell, Check, Loader2, UserPlus, X as XIcon, MessageSquare, AlertCircle, Phone, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const { respondToRequest } = useFriendActions();
  const router = useRouter();

  // Track local request states to immediately update UI without waiting for db reload
  const [requestStates, setRequestStates] = useState<Record<string, 'pending' | 'accepted' | 'declined'>>({});

  useEffect(() => {
    if (!profile) return;
    loadNotifications();

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, 
        (payload) => {
          // Handle real-time updates smoothly
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
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setNotifications(data || []);
      
      // Initialize states for friend requests
      const reqStates: Record<string, 'pending' | 'accepted' | 'declined'> = {};
      (data || []).forEach(n => {
        if (n.type === 'friend_request') {
          reqStates[n.id] = 'pending';
        }
      });
      setRequestStates(reqStates);
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus size={18} className="text-[#8B5CF6]" />;
      case 'friend_accept': return <Check size={18} className="text-[#10B981]" />;
      case 'message': return <MessageSquare size={18} className="text-[#EC4899]" />;
      case 'call': return <Phone size={18} className="text-[#8B5CF6]" />;
      case 'system': return <Info size={18} className="text-[#F59E0B]" />;
      default: return <Bell size={18} className="text-[#667085] dark:text-[#98A2B3]" />;
    }
  };

  const handleAction = async (n: Notification, action: 'accepted' | 'declined') => {
    if (!profile || !n.data?.sender_id) return;
    
    // Optimistic UI update
    setRequestStates(prev => ({ ...prev, [n.id]: action }));
    
    const { data: reqs } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('sender_id', n.data.sender_id)
      .eq('receiver_id', profile.id)
      .eq('status', 'pending');
      
    if (reqs && reqs.length > 0) {
      await respondToRequest(reqs[0].id, n.data.sender_id as string, action);
    }
  };

  const today = notifications.filter(n => isToday(new Date(n.created_at)));
  const yesterday = notifications.filter(n => isYesterday(new Date(n.created_at)));
  const earlier = notifications.filter(n => !isToday(new Date(n.created_at)) && !isYesterday(new Date(n.created_at)));

  const NotificationCard = ({ n }: { n: Notification }) => {
    const isFriendReq = n.type === 'friend_request';
    const reqState = requestStates[n.id] || 'pending';
    const hasAvatar = !!n.data?.sender_avatar || !!n.data?.sender_name;
    const isUnread = !n.is_read;
    
    return (
      <div 
        onClick={() => {
          if (n.type === 'friend_request' || n.type === 'friend_accept') {
            const targetId = n.data?.sender_id || n.data?.receiver_id;
            if (targetId) router.push(`/profile/${targetId}`);
          }
        }}
        className={cn(
          "relative p-4 rounded-[16px] border transition-all cursor-pointer shadow-sm group",
          isUnread 
            ? "bg-[#FFFFFF] dark:bg-[#151922] border-[#8B5CF6]/30 dark:border-[#8B5CF6]/30" 
            : "bg-[#FFFFFF] dark:bg-[#11141A] border-[#EAECF0] dark:border-[#252A34] hover:bg-[#F9FAFB] dark:hover:bg-[#151922]"
        )}
      >
        {isUnread && (
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#8B5CF6]" />
        )}
        
        <div className="flex gap-3.5">
          <div className="flex-shrink-0 pt-0.5">
            {isFriendReq && hasAvatar ? (
              <UserAvatar 
                src={(n.data?.sender_avatar as string) || undefined} 
                name={(n.data?.sender_name as string) || 'User'} 
                size="md" 
                className="w-10 h-10" 
              />
            ) : (
              <div className="w-10 h-10 bg-[#F8FAFC] dark:bg-[#1A1E29] rounded-full border border-[#EAECF0] dark:border-[#252A34] flex items-center justify-center">
                {getIcon(n.type)}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={cn("text-[14px] font-semibold truncate", isUnread ? "text-[#101828] dark:text-[#F5F7FA]" : "text-[#344054] dark:text-[#D0D5DD]")}>
                {isFriendReq && n.data?.sender_name ? n.data.sender_name as string : n.title}
              </h3>
              <span className="text-[12px] font-medium text-[#98A2B3] flex-shrink-0 mt-0.5">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: false }).replace('about ', '')}
              </span>
            </div>
            
            <p className={cn("text-[13px] leading-relaxed", isUnread ? "text-[#344054] dark:text-[#D0D5DD]" : "text-[#667085] dark:text-[#98A2B3]")}>
              {isFriendReq ? 'sent you a friend request' : n.body}
            </p>
            
            {isFriendReq && (
              <div className="mt-3">
                {reqState === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(n, 'accepted'); }}
                      className="h-8 px-4 bg-[#8B5CF6] text-white text-[13px] font-semibold rounded-[8px] hover:bg-[#7C3AED] transition-all shadow-sm outline-none"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(n, 'declined'); }}
                      className="h-8 px-3 bg-transparent border border-[#EAECF0] dark:border-[#374151] text-[#344054] dark:text-[#D0D5DD] text-[13px] font-medium rounded-[8px] hover:bg-[#F8FAFC] dark:hover:bg-[#252A34] transition-all shadow-sm outline-none"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <p className={cn("text-[13px] font-medium flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-md", reqState === 'accepted' ? "text-[#10B981] dark:text-[#32D583] bg-[#10B981]/10 dark:bg-[#10B981]/20" : "text-[#667085] dark:text-[#98A2B3] bg-[#F1F3F5] dark:bg-[#1A1E29]")}>
                    {reqState === 'accepted' ? (
                      <><Check size={14} /> You're now friends</>
                    ) : (
                      <><XIcon size={14} /> Request declined</>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SkeletonLoaders = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 rounded-[16px] bg-[#FFFFFF] dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] flex gap-3.5">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1A1E29] animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2.5 py-1">
            <div className="flex justify-between">
              <div className="w-32 h-4 bg-gray-200 dark:bg-[#1A1E29] rounded animate-pulse" />
              <div className="w-8 h-3 bg-gray-200 dark:bg-[#1A1E29] rounded animate-pulse" />
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
            <p className="text-[14px] text-[#667085] dark:text-[#98A2B3] mt-1">Stay up to date with your activity</p>
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
              <div className="w-12 h-12 bg-[#F1F3F5] dark:bg-[#1A1E29] rounded-full flex items-center justify-center mb-4 border border-[#EAECF0] dark:border-[#252A34]">
                <Bell className="w-6 h-6 text-[#98A2B3]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">You're all caught up</h3>
              <p className="text-[13px] text-[#667085] dark:text-[#98A2B3]">No new notifications right now.</p>
            </div>
          ) : (
            <div className="space-y-8 pb-10">
              {today.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-[12px] font-bold text-[#98A2B3] uppercase tracking-wider mb-3 ml-1">Today</h2>
                  <div className="space-y-2">
                    {today.map(n => <NotificationCard key={n.id} n={n} />)}
                  </div>
                </section>
              )}
              
              {yesterday.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
                  <h2 className="text-[12px] font-bold text-[#98A2B3] uppercase tracking-wider mb-3 ml-1">Yesterday</h2>
                  <div className="space-y-2">
                    {yesterday.map(n => <NotificationCard key={n.id} n={n} />)}
                  </div>
                </section>
              )}
              
              {earlier.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
                  <h2 className="text-[12px] font-bold text-[#98A2B3] uppercase tracking-wider mb-3 ml-1">Earlier</h2>
                  <div className="space-y-2">
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
