'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, CheckCheck, Loader2, UserPlus, X as XIcon, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const profile = useAuthStore(s => s.profile);
  const { respondToRequest } = useFriendActions();
  const router = useRouter();

  useEffect(() => {
    if (!profile) return;
    loadNotifications();

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, () => loadNotifications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  async function loadNotifications() {
    if (!profile) return;
    setIsLoading(true);
    const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(50);
    setNotifications(data || []);
    setIsLoading(false);
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllAsRead() {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus className="w-4 h-4 text-[#8B5CF6]" />;
      case 'friend_accept': return <Check className="w-4 h-4 text-[#12B76A]" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-[#EC4899]" />;
      default: return <Bell className="w-4 h-4 text-[#667085] dark:text-[#98A2B3]" />;
    }
  };

  const handleAction = async (n: Notification, action: 'accepted' | 'declined') => {
    if (!profile || !n.data?.sender_id) return;
    
    // We need to fetch the request ID first
    const { data: reqs } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('sender_id', n.data.sender_id)
      .eq('receiver_id', profile.id)
      .eq('status', 'pending');
      
    if (reqs && reqs.length > 0) {
      const ok = await respondToRequest(reqs[0].id, n.data.sender_id as string, action);
      if (ok) markAsRead(n.id);
    } else {
      // Request might have been cancelled or already responded to
      markAsRead(n.id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#0B0D12]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F5F7FA]">Notifications</h1>
            {unreadCount > 0 && <p className="text-[13px] text-[#667085] dark:text-[#98A2B3] mt-1">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="flex items-center gap-1.5 text-[13px] font-medium text-[#8B5CF6] hover:text-[#7C3AED] transition-colors">
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#8B5CF6] animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <div className="flex justify-center py-12">
            <EmptyState variant="no-notifications" />
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className={cn(
                  "p-4 rounded-[16px] border transition-all cursor-pointer shadow-sm",
                  !n.is_read ? "bg-white dark:bg-[#151922] border-[#8B5CF6]/30 dark:border-[#8B5CF6]/30" : "bg-white dark:bg-[#11141A] border-[#EAECF0] dark:border-[#252A34]"
                )}
                onClick={() => {
                  if (!n.is_read) markAsRead(n.id);
                  if (n.type === 'friend_request' || n.type === 'friend_accept') {
                    const targetId = n.data?.sender_id || n.data?.receiver_id;
                    if (targetId) router.push(`/profile/${targetId}`);
                  }
                }}
              >
                <div className="flex gap-4">
                  <div className="mt-0.5 p-2 bg-[#F8FAFC] dark:bg-[#151922] rounded-full border border-[#EAECF0] dark:border-[#252A34] flex-shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn("font-medium text-[14px]", !n.is_read ? "text-[#101828] dark:text-[#F5F7FA]" : "text-[#344054] dark:text-[#D0D5DD]")}>
                        {n.title}
                      </h3>
                      <span className="text-[12px] text-[#98A2B3] whitespace-nowrap">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {n.body && (
                      <p className={cn("mt-1 text-[13px] leading-relaxed", !n.is_read ? "text-[#344054] dark:text-[#D0D5DD]" : "text-[#667085] dark:text-[#98A2B3]")}>
                        {n.body}
                      </p>
                    )}
                    
                    {n.type === 'friend_request' && !n.is_read && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(n, 'accepted'); }}
                          className="px-4 py-2 bg-[#8B5CF6] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#7C3AED] transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Accept
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(n, 'declined'); }}
                          className="px-3 py-2 bg-white dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] text-[13px] font-medium rounded-[8px] hover:bg-[#F8FAFC] dark:hover:bg-[#252A34] transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <XIcon className="w-4 h-4" /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
