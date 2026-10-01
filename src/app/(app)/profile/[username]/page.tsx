'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useFriendActions } from '@/hooks/useFriendActions';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, MessageSquare, UserPlus, Check, X as XIcon, Clock, ShieldAlert, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';

type Props = {
  params: Promise<{ username: string }>;
};

export default function PublicProfilePage(props: Props) {
  const resolvedParams = use(props.params);
  const router = useRouter();
  const username = resolvedParams?.username as string | undefined;
  
  const myProfile = useAuthStore(s => s.profile);
  const supabase = createClient();
  const { sendFriendRequest, respondToRequest, removeFriend } = useFriendActions();

  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [relationship, setRelationship] = useState<'friend' | 'incoming_request' | 'outgoing_request' | 'none'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    async function fetchProfileAndStatus() {
      if (!username) {
        setLoading(false);
        return;
      }
      
      setLoading(true);

      try {
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('username_normalized', username.toLowerCase())
          .single();
          
        if (!profile) {
          const { data: profileById } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', username)
            .single();
          profile = profileById;
        }

        setTargetProfile(profile || null);

        if (profile && myProfile && profile.id && myProfile.id && profile.id !== myProfile.id) {
          const { data: friendships } = await supabase
            .from('friendships')
            .select('*')
            .or('and(user_id.eq.' + myProfile.id + ',friend_id.eq.' + profile.id + '),and(user_id.eq.' + profile.id + ',friend_id.eq.' + myProfile.id + ')');

          if (friendships && friendships.length > 0) {
            setRelationship('friend');
          } else {
            const { data: reqs } = await supabase
              .from('friend_requests')
              .select('*')
              .or('and(sender_id.eq.' + myProfile.id + ',receiver_id.eq.' + profile.id + '),and(sender_id.eq.' + profile.id + ',receiver_id.eq.' + myProfile.id + ')')
              .eq('status', 'pending');

            if (reqs && reqs.length > 0) {
              const req = reqs[0];
              setRequestId(req.id);
              if (req.sender_id === myProfile.id) {
                setRelationship('outgoing_request');
              } else {
                setRelationship('incoming_request');
              }
            } else {
              setRelationship('none');
            }
          }
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileAndStatus();
  }, [username, myProfile, supabase]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0D12]">
        <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0D12] p-4 text-center">
        <div className="w-16 h-16 bg-white dark:bg-[#11141A] rounded-[16px] border border-[#EAECF0] dark:border-[#252A34] flex items-center justify-center mb-4 shadow-sm">
          <Search className="w-6 h-6 text-[#98A2B3]" />
        </div>
        <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#F5F7FA] mb-2">User Not Found</h2>
        <p className="text-[14px] text-[#667085] dark:text-[#98A2B3] mb-6">The profile {username ? '@' + username : 'you requested'} does not exist.</p>
        <button onClick={() => router.push('/search')} className="px-5 py-2 bg-white dark:bg-[#151922] text-[#344054] dark:text-[#D0D5DD] font-medium text-[13px] rounded-[8px] border border-[#EAECF0] dark:border-[#252A34] hover:bg-[#F8FAFC] dark:hover:bg-[#252A34] transition-colors shadow-sm">
          Back to Search
        </button>
      </div>
    );
  }

  const isMe = myProfile?.id === targetProfile.id;

  async function handleStartChat() {
    if (!myProfile || !targetProfile) return;
    setIsStartingChat(true);
    try {
      const { data, error } = await supabase.rpc('get_or_create_direct_conversation', { p_user1_id: myProfile.id, p_user2_id: targetProfile.id });
      if (error) throw error;
      router.push('/chat/' + data);
    } catch (error: any) {
      toast.error(JSON.stringify(error) || error.message || 'Failed to start chat');
      console.error(error);
    } finally {
      setIsStartingChat(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-[#0B0D12] overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1 flex flex-col">
        <button onClick={() => router.back()} className="group flex items-center gap-2 text-[#667085] hover:text-[#101828] dark:text-[#98A2B3] dark:hover:text-[#F5F7FA] transition-colors mb-6 w-fit">
          <div className="p-1.5 bg-white dark:bg-[#11141A] rounded-[8px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm">
             <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium text-[13px]">Back</span>
        </button>

        <div className="bg-white dark:bg-[#11141A] rounded-[24px] border border-[#EAECF0] dark:border-[#252A34] shadow-sm overflow-hidden animate-in fade-in duration-300 relative z-10">
          <div className="h-28 md:h-40 bg-gradient-to-r from-[#8B5CF6]/10 to-[#EC4899]/10 dark:from-[#8B5CF6]/20 dark:to-[#EC4899]/20 relative">
             <div className="absolute inset-0 bg-[#F8FAFC]/50 dark:bg-[#0B0D12]/50 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="px-6 md:px-10 pb-8 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12 md:-mt-16 mb-6">
               <div className="relative w-fit">
                  <UserAvatar
                    src={targetProfile.avatar_url || ''}
                    name={targetProfile.display_name || 'User'}
                    size="xl"
                    className="w-24 h-24 md:w-32 md:h-32 ring-4 ring-white dark:ring-[#11141A] shadow-sm bg-[#EAECF0] dark:bg-[#252A34]"
                  />
                  {targetProfile.is_online && (
                     <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-5 h-5 md:w-6 md:h-6 bg-[#12B76A] border-4 border-white dark:border-[#11141A] rounded-full"></div>
                  )}
               </div>

               {!isMe && (
                 <div className="flex flex-wrap items-center gap-2">
                   {relationship === 'none' && (
                     <button onClick={async () => {
                         const ok = await sendFriendRequest(targetProfile.id);
                         if (ok) setRelationship('outgoing_request');
                       }}
                       className="flex-1 md:flex-none px-4 py-2 bg-[#101828] dark:bg-[#F5F7FA] text-white dark:text-[#101828] rounded-[8px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#1D2939] dark:hover:bg-white transition-all shadow-sm">
                       <UserPlus className="w-4 h-4" /> Add Friend
                     </button>
                   )}

                   {relationship === 'outgoing_request' && (
                     <button disabled className="flex-1 md:flex-none px-4 py-2 bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#98A2B3] rounded-[8px] text-[13px] font-medium flex items-center justify-center gap-2 cursor-not-allowed">
                       <Clock className="w-4 h-4" /> Request Sent
                     </button>
                   )}

                   {relationship === 'incoming_request' && requestId && (
                     <>
                       <button onClick={async () => {
                           const ok = await respondToRequest(requestId, targetProfile.id, 'accepted');
                           if (ok) setRelationship('friend');
                         }}
                         className="flex-1 md:flex-none px-4 py-2 bg-[#12B76A] text-white rounded-[8px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#0E9F5D] transition-all shadow-sm">
                         <Check className="w-4 h-4" /> Accept
                       </button>
                       <button onClick={async () => {
                           const ok = await respondToRequest(requestId, targetProfile.id, 'declined');
                           if (ok) setRelationship('none');
                         }}
                         className="px-3 py-2 bg-[#F8FAFC] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#667085] dark:text-[#98A2B3] rounded-[8px] text-[13px] font-medium hover:bg-[#EAECF0] dark:hover:bg-[#252A34] transition-all flex items-center justify-center">
                         <XIcon className="w-4 h-4" />
                       </button>
                     </>
                   )}

                   {relationship === 'friend' && (
                     <>
                       <button onClick={handleStartChat} disabled={isStartingChat} className="flex-1 md:flex-none px-4 py-2 bg-[#8B5CF6] text-white rounded-[8px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#7C3AED] transition-all shadow-sm">
                         {isStartingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                         Message
                       </button>
                       <button onClick={async () => {
                           if (confirm('Remove ' + (targetProfile.display_name || 'this user') + ' from friends?')) {
                             const ok = await removeFriend(targetProfile.id);
                             if (ok) setRelationship('none');
                           }
                         }}
                         className="px-3 py-2 bg-white dark:bg-[#11141A] border border-[#F04438]/20 text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-[#4A1519]/20 rounded-[8px] text-[13px] font-medium transition-all flex items-center justify-center">
                         Remove
                       </button>
                     </>
                   )}
                   
                   <button className="p-2 bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] text-[#98A2B3] hover:text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-[#4A1519]/20 rounded-[8px] transition-colors shadow-sm" title="Block User">
                     <ShieldAlert className="w-4 h-4" />
                   </button>
                 </div>
               )}
            </div>
            
            <div className="space-y-4">
              <div>
                 <h1 className="text-2xl md:text-3xl font-bold text-[#101828] dark:text-[#F5F7FA] tracking-tight break-words line-clamp-2">
                   {targetProfile.display_name || 'User'}
                 </h1>
                 <p className="text-[14px] text-[#667085] dark:text-[#98A2B3] mt-0.5 truncate">
                   @{targetProfile.username || 'unknown'}
                 </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#667085] dark:text-[#98A2B3] font-medium">
                 <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Joined {targetProfile.created_at ? format(new Date(targetProfile.created_at), 'MMMM yyyy') : 'Unknown'}
                 </div>
              </div>
              
              {targetProfile.bio && (
                 <div className="pt-5 mt-5 border-t border-[#EAECF0] dark:border-[#252A34]">
                    <h3 className="text-[12px] font-semibold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider mb-2">About</h3>
                    <p className="text-[14px] text-[#344054] dark:text-[#D0D5DD] whitespace-pre-wrap leading-relaxed">
                      {targetProfile.bio}
                    </p>
                 </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
