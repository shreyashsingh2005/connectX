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
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#0B0F19]">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#0B0F19] p-4 text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-[#151922] rounded-full flex items-center justify-center mb-4">
          <Search className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">The profile {username ? '@' + username : 'you requested'} does not exist.</p>
        <button onClick={() => router.push('/search')} className="px-6 py-2.5 bg-gray-100 dark:bg-[#151922] text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-[#374151] transition-colors">
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
      <div className="max-w-4xl mx-auto w-full px-4 py-8 md:py-12 flex-1 flex flex-col">
        <button onClick={() => router.back()} className="group flex items-center gap-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-6 w-fit">
          <div className="p-2 bg-white dark:bg-[#111827] rounded-full shadow-sm border border-gray-100 dark:border-[#252A34] group-hover:scale-105 transition-transform">
             <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Back</span>
        </button>

        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-[#252A34] shadow-xl overflow-hidden animate-fade-in relative z-10">
          <div className="h-32 md:h-56 w-full bg-[#8B5CF6] relative">
             <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
             <div className="absolute top-10 left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
          </div>
          
          <div className="px-6 md:px-10 pb-10 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 md:-mt-24 mb-6">
               <div className="relative w-fit">
                  <UserAvatar
                    src={targetProfile.avatar_url || ''}
                    name={targetProfile.display_name || 'User'}
                    size="xl"
                    className="w-32 h-32 md:w-40 md:h-40 ring-8 ring-white dark:ring-[#111827] shadow-xl bg-white dark:bg-[#111827]"
                  />
                  {targetProfile.is_online && (
                     <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-6 h-6 md:w-7 md:h-7 bg-green-500 border-4 border-white dark:border-[#111827] rounded-full shadow-sm"></div>
                  )}
               </div>

               {!isMe && (
                 <div className="flex flex-wrap items-center gap-3">
                   {relationship === 'none' && (
                     <button onClick={async () => {
                         const ok = await sendFriendRequest(targetProfile.id);
                         if (ok) setRelationship('outgoing_request');
                       }}
                       className="flex-1 md:flex-none px-6 py-2.5 bg-[#8B5CF6] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#8B5CF6]/25">
                       <UserPlus className="w-5 h-5" /> Add Friend
                     </button>
                   )}

                   {relationship === 'outgoing_request' && (
                     <button disabled className="flex-1 md:flex-none px-6 py-2.5 bg-gray-100 dark:bg-[#151922] text-gray-500 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                       <Clock className="w-5 h-5" /> Request Sent
                     </button>
                   )}

                   {relationship === 'incoming_request' && requestId && (
                     <>
                       <button onClick={async () => {
                           const ok = await respondToRequest(requestId, targetProfile.id, 'accepted');
                           if (ok) setRelationship('friend');
                         }}
                         className="flex-1 md:flex-none px-6 py-2.5 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/25">
                         <Check className="w-5 h-5" /> Accept
                       </button>
                       <button onClick={async () => {
                           const ok = await respondToRequest(requestId, targetProfile.id, 'declined');
                           if (ok) setRelationship('none');
                         }}
                         className="px-4 py-2.5 bg-gray-100 dark:bg-[#151922] text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-[#374151] transition-all flex items-center justify-center">
                         <XIcon className="w-5 h-5" />
                       </button>
                     </>
                   )}

                   {relationship === 'friend' && (
                     <>
                       <button onClick={handleStartChat} disabled={isStartingChat} className="flex-1 md:flex-none px-6 py-2.5 bg-[#8B5CF6] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#8B5CF6]/25">
                         {isStartingChat ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                         Message
                       </button>
                       <button onClick={async () => {
                           if (confirm('Remove ' + (targetProfile.display_name || 'this user') + ' from friends?')) {
                             const ok = await removeFriend(targetProfile.id);
                             if (ok) setRelationship('none');
                           }
                         }}
                         className="px-4 py-2.5 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center">
                         Remove
                       </button>
                     </>
                   )}
                   
                   <button className="p-2.5 bg-gray-50 dark:bg-[#11141A] text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors border border-gray-100 dark:border-[#252A34]" title="Block User">
                     <ShieldAlert className="w-5 h-5" />
                   </button>
                 </div>
               )}
            </div>
            
            <div className="space-y-4">
              <div className="w-full">
                 <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight break-words line-clamp-2">
                   {targetProfile.display_name || 'User'}
                 </h1>
                 <p className="text-lg text-pink-500 font-medium mt-1 truncate">
                   @{targetProfile.username || 'unknown'}
                 </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium pt-2">
                 <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Joined {targetProfile.created_at ? format(new Date(targetProfile.created_at), 'MMMM yyyy') : 'Unknown'}
                 </div>
              </div>
              
              {targetProfile.bio && (
                 <div className="pt-4 border-t border-gray-100 dark:border-[#252A34]">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-3">About</h3>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-[15px]">
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
