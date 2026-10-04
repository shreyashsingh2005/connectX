'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification } from '@/types';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Bell, Check, Loader2, MessageSquare, AlertCircle, Phone, Info, MoreHorizontal, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';
import toast from 'react-hot-toast';
import { useFriendActions } from '@/hooks/useFriendActions';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingSenderIds, setPendingSenderIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const router = useRouter();
  const { respondToRequest } = useFriendActions();

  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!profile) return;
    loadNotifications();

    const notifChannel = supabase
      .channel(`notifications_page:${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, 
        (payload) => {
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

    const reqChannel = supabase
      .channel(`requests_page:${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${profile.id}` }, 
        () => {
          loadPendingRequests();
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(notifChannel); 
      supabase.removeChannel(reqChannel);
    };
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

  async function loadPendingRequests() {
    if (!profile) return;
    const { data } = await supabase
      .from('friend_requests')
      .select('sender_id')
      .eq('receiver_id', profile.id)
      .eq('status', 'pending');
      
    setPendingSenderIds(new Set(data?.map(r => r.sender_id) || []));
  }

  async function loadNotifications() {
    if (!profile) return;
    setIsLoading(true);
    setError(null);
    try {
      await loadPendingRequests();
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(null);
    
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete notification');
      loadNotifications(); // Revert on failure
    }
  };
  
  const handleRequestAction = async (n: Notification, status: 'accepted' | 'declined', e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic update of local pending set
    const senderId = n.data?.sender_id as string;
    const requestId = n.data?.request_id as string;
    
    if (senderId) {
      setPendingSenderIds(prev => {
        const next = new Set(prev);
        next.delete(senderId);
        return next;
      });
    }
    
    if (requestId && senderId) {
      await respondToRequest(requestId, senderId, status);
      // Optional: Delete the notification after action
      handleDelete(n.id, e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className="text-[#EC4899]" />;
      case 'call': return <Phone size={16} className="text-[#8B5CF6]" />;
      case 'system': return <Info size={16} className="text-[#F59E0B]" />;
      case 'friend_accept': return <Check size={16} className="text-[#10B981]" />;
      default: return <Bell size={16} className="text-[#667085] dark:text-[#A7AFB8]" />;
    }
  };

  const NotificationCard = ({ n }: { n: Notification }) => {
    const isUnread = !n.is_read;
    const hasAvatar = !!n.data?.sender_avatar || !!n.data?.sender_name;
    const isFriendRequest = n.type === 'friend_request';
    const senderId = n.data?.sender_id as string | undefined;
    const isPending = senderId ? pendingSenderIds.has(senderId) : false;
    
    // Hide stale friend requests
    if (isFriendRequest && !isPending) return null;
    
    return (
      <div 
        onClick={() => {
          const targetId = n.data?.sender_id || n.data?.conversation_id;
          if (targetId && n.type === 'message') router.push(`/chat/${targetId}`);
        }}
        className={cn(
          "flex items-start gap-3 p-3 h-auto min-h-[64px] rounded-[14px] border transition-all cursor-pointer group relative",
          isUnread 
            ? "bg-white dark:bg-[rgba(255,255,255,0.06)] border-[#8B5CF6]/30 dark:border-[#8B5CF6]/30 shadow-sm" 
            : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.02)] hover:border-[#EAECF0] dark:hover:border-white/5"
        )}
      >
        <div className="flex-shrink-0 relative mt-1">
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
            <div className="w-[36px] h-[36px] bg-[#F8FAFC] dark:bg-[rgba(255,255,255,0.06)] rounded-full border border-[#EAECF0] dark:border-white/5 flex items-center justify-center">
              {getIcon(n.type)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={cn("text-[13px] font-semibold truncate", isUnread ? "text-[#101828] dark:text-[#F5F7FA]" : "text-[#344054] dark:text-[#F5F7FA]")}>
                {n.title}
              </h3>
              {n.body && (
                <p className={cn("text-[13px] leading-snug mt-0.5", isUnread ? "text-[#344054] dark:text-[#F5F7FA]" : "text-[#667085] dark:text-[#A7AFB8]")}>
                  {n.body}
                </p>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#A7AFB8]">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: false }).replace('about ', '')}
                </span>
                
                {/* Overflow Menu */}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === n.id ? null : n.id);
                    }}
                    className="p-1 -mr-1 text-[#A7AFB8] hover:text-[#344054] dark:hover:text-[#F5F7FA] hover:bg-[#F1F3F5] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-full transition-colors outline-none"
                  >
                    <MoreHorizontal size={18} strokeWidth={2} />
                  </button>
                  
                  {activeMenu === n.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[rgba(255,255,255,0.06)] border border-[#EAECF0] dark:border-white/5 rounded-[10px] shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                      <button 
                        onClick={(e) => handleDelete(n.id, e)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-[#F04438]/10 transition-colors outline-none"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Actionable Friend Request Area */}
          {isFriendRequest && isPending && (
            <div className="flex items-center gap-2 mt-3 mb-1">
              <button 
                onClick={(e) => handleRequestAction(n, 'accepted', e)}
                className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[13px] font-medium py-1.5 px-3 rounded-[8px] transition-colors outline-none shadow-sm"
              >
                Accept
              </button>
              <button 
                onClick={(e) => handleRequestAction(n, 'declined', e)}
                className="flex-1 bg-white dark:bg-[rgba(255,255,255,0.06)] border border-[#EAECF0] dark:border-white/5 text-[#344054] dark:text-[#F5F7FA] hover:bg-[#F9FAFB] dark:hover:bg-[rgba(255,255,255,0.08)] text-[13px] font-medium py-1.5 px-3 rounded-[8px] transition-colors outline-none shadow-sm"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SkeletonLoaders = () => (
    <div className="space-y-1">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 min-h-[64px] rounded-[14px] bg-transparent">
          <div className="w-[36px] h-[36px] rounded-full bg-gray-200 dark:bg-[rgba(255,255,255,0.06)] animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="flex justify-between items-center">
              <div className="w-24 h-3 bg-gray-200 dark:bg-[rgba(255,255,255,0.06)] rounded animate-pulse" />
              <div className="w-8 h-2 bg-gray-200 dark:bg-[rgba(255,255,255,0.06)] rounded animate-pulse" />
            </div>
            <div className="w-48 h-3 bg-gray-200 dark:bg-[rgba(255,255,255,0.06)] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  const visibleNotifications = notifications.filter(n => {
    if (n.type === 'friend_request') {
      const senderId = n.data?.sender_id as string | undefined;
      return senderId ? pendingSenderIds.has(senderId) : false;
    }
    return true;
  });

  const today = visibleNotifications.filter(n => isToday(new Date(n.created_at)));
  const yesterday = visibleNotifications.filter(n => isYesterday(new Date(n.created_at)));
  const earlier = visibleNotifications.filter(n => !isToday(new Date(n.created_at)) && !isYesterday(new Date(n.created_at)));

  return (
    <div className="flex flex-col flex-1 z-10 overflow-hidden relative bg-white dark:bg-[#0B0F12]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="mb-8">
            <h1 className="text-[24px] md:text-[28px] font-bold text-[#101828] dark:text-[#F5F7FA] tracking-tight">Notifications</h1>
            <p className="text-[14px] text-[#667085] dark:text-[#A7AFB8] mt-1">Stay up to date with your activity.</p>
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
          ) : visibleNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 bg-white dark:bg-[#11161B] rounded-full flex items-center justify-center mb-4 border border-[#EAECF0] dark:border-white/5 shadow-sm">
                <Bell className="w-5 h-5 text-[#A7AFB8]" strokeWidth={1.75} />
              </div>
              <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-1">You're all caught up</h3>
              <p className="text-[13px] text-[#667085] dark:text-[#A7AFB8]">No new notifications right now.</p>
            </div>
          ) : (
            <div className="space-y-6 pb-10">
              {today.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-[12px] font-bold text-[#A7AFB8] uppercase tracking-wider mb-2 ml-1">Today</h2>
                  <div className="space-y-1">
                    {today.map(n => <NotificationCard key={n.id} n={n} />)}
                  </div>
                </section>
              )}
              
              {yesterday.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
                  <h2 className="text-[12px] font-bold text-[#A7AFB8] uppercase tracking-wider mb-2 ml-1">Yesterday</h2>
                  <div className="space-y-1">
                    {yesterday.map(n => <NotificationCard key={n.id} n={n} />)}
                  </div>
                </section>
              )}
              
              {earlier.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
                  <h2 className="text-[12px] font-bold text-[#A7AFB8] uppercase tracking-wider mb-2 ml-1">Earlier</h2>
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
