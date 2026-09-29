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
      case 'friend_request': return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'friend_accept': return <Check className="w-5 h-5 text-green-500" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-pink-500" />;
      default: return <Bell className="w-5 h-5 text-purple-500" />;
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
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0B0F19]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="flex items-center gap-2 text-sm text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300 transition-colors">
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <EmptyState variant="no-notifications" />
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer",
                  !n.is_read ? "bg-pink-50/50 dark:bg-pink-900/10 border-pink-100 dark:border-pink-900/30" : "bg-gray-50 dark:bg-[#111827] border-gray-100 dark:border-[#1F2937]"
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
                  <div className="mt-1 p-2 bg-white dark:bg-[#171E2D] rounded-full shadow-sm flex-shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn("font-medium", !n.is_read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300")}>
                        {n.title}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {n.body && (
                      <p className={cn("mt-1 text-sm", !n.is_read ? "text-gray-600 dark:text-gray-400" : "text-gray-500")}>
                        {n.body}
                      </p>
                    )}
                    
                    {n.type === 'friend_request' && !n.is_read && (
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(n, 'accepted'); }}
                          className="px-4 py-2 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-md shadow-pink-500/20 flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Accept
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(n, 'declined'); }}
                          className="px-4 py-2 bg-gray-200 dark:bg-[#1F2937] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-[#374151] transition-all flex items-center gap-2"
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
