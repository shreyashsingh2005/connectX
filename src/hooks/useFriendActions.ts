import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';

export function useFriendActions() {
  const [loading, setLoading] = useState(false);
  const profile = useAuthStore(s => s.profile);
  const supabase = createClient();

  const sendFriendRequest = async (targetId: string) => {
    if (!profile) return false;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('send_friend_request', {
        p_sender_id: profile.id,
        p_receiver_id: targetId
      });

      if (error) throw error;
      if (data && !data.success) {
         if (data.state === 'OUTGOING_PENDING') {
           toast.error('Request already sent');
           return { success: false, state: 'OUTGOING_PENDING' };
         }
         if (data.state === 'INCOMING_PENDING') {
           toast.error('They already sent you a request');
           return { success: false, state: 'INCOMING_PENDING' };
         }
         if (data.state === 'FRIENDS') {
           toast.error('Already friends');
           return { success: false, state: 'FRIENDS' };
         }
         throw new Error(data.error || 'Failed to send request');
      }
      
      toast.success('Friend request sent!');
      return { success: true, state: 'OUTGOING_PENDING' };
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request');
      return { success: false, state: 'NONE' };
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, senderId: string, status: 'accepted' | 'declined') => {
    if (!profile) return false;
    setLoading(true);
    try {
      if (status === 'accepted') {
        const { data, error } = await supabase.rpc('accept_friend_request', {
          p_request_id: requestId,
          p_user_id: profile.id
        });
        if (error) throw error;
        if (data && !data.success) throw new Error(data.error || 'Failed to accept request');
        toast.success('Friend request accepted!');
      } else {
        const { error } = await supabase
          .from('friend_requests')
          .update({ status: 'rejected' })
          .eq('id', requestId);
        if (error) throw error;
        toast.success('Friend request declined');
      }
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to respond to request');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    if (!profile) return false;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      toast.success('Request cancelled');
      return true;
    } catch (error: any) {
      toast.error('Failed to cancel request');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (targetUserId: string) => {
    if (!profile) return false;
    setLoading(true);
    try {
      const { error } = await supabase.rpc('remove_friend', { target_friend_id: targetUserId });

      if (error) throw error;
      toast.success('Friend removed');
      return true;
    } catch (error: any) {
      toast.error('Failed to remove friend');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendFriendRequest,
    respondToRequest,
    cancelRequest,
    removeFriend,
    loading
  };
}
