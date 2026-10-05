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
        
        let profile = null;
        
        // 1. First, check if it's a valid UUID (which is our canonical ID)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(username);
        
        if (isUUID) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', username)
            .single();
            
          profile = data;
        } 
        
        // 2. If not a UUID (backward compatibility for old username links), or if UUID lookup failed
        if (!profile) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('username_normalized', username.toLowerCase())
            .single();
            
          profile = data;
          
          // If we found them by username, we could canonicalize the URL silently, but for now we just render.
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
      <div className="flex-1 flex items-center justify-center bg-bg-surface">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-surface p-4 text-center">
        <div className="w-16 h-16 bg-bg-surface rounded-[16px] border border-border-subtle flex items-center justify-center mb-4 shadow-sm">
          <Search className="w-6 h-6 text-text-sec" />
        </div>
        <h2 className="text-[18px] font-semibold text-text-main mb-2">User Not Found</h2>
        <p className="text-[14px] text-text-sec mb-6">The profile {username ? '@' + username : 'you requested'} does not exist.</p>
        <button onClick={() => router.push('/search')} className="px-5 py-2 bg-bg-surface text-text-main font-medium text-[13px] rounded-[8px] border border-border-subtle hover:bg-bg-secondary transition-colors shadow-sm">
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
      const { data: convId, error } = await supabase.rpc('start_direct_conversation', { 
        other_user_id: targetProfile.id 
      });
      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      if (!convId) throw new Error('No conversation ID returned');
      router.push('/chat/' + convId);
    } catch (error: any) {
      toast.error('Could not start conversation');
      console.error(error);
    } finally {
      setIsStartingChat(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-surface overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1 flex flex-col">
        <button onClick={() => router.back()} className="group flex items-center gap-2 text-text-sec hover:text-text-main dark:hover:text-text-main transition-colors mb-6 w-fit">
          <div className="p-1.5 bg-bg-surface rounded-[8px] border border-border-subtle shadow-sm">
             <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium text-[13px]">Back</span>
        </button>

        <div className="bg-bg-surface rounded-[24px] border border-border-subtle shadow-sm dark:shadow-none overflow-hidden animate-in fade-in duration-300 relative z-10">
          <div className="h-28 md:h-40 bg-gradient-to-r from-[#8B5CF6]/10 to-[#EC4899]/10 dark:from-[#8B5CF6]/20 dark:to-[#EC4899]/20 relative">
             <div className="absolute inset-0 bg-[#F8FAFC]/50 dark:bg-bg-primary/50 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="px-6 md:px-10 pb-8 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12 md:-mt-16 mb-6">
               <div className="relative w-fit">
                  <UserAvatar
                    src={targetProfile.avatar_url || ''}
                    name={targetProfile.display_name || 'User'}
                    size="xl"
                    className="w-[72px] h-[72px] ring-4 ring-white dark:ring-[#11161B] shadow-sm bg-[#EAECF0] dark:bg-bg-surface/5"
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
                       className="flex-1 md:flex-none px-[12px] h-[36px] bg-[#101828] dark:bg-[#F5F7FA] text-white dark:text-text-main rounded-[8px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#1D2939] dark:hover:bg-bg-surface transition-all shadow-sm">
                       <UserPlus className="w-4 h-4" /> Add Friend
                     </button>
                   )}

                   {relationship === 'outgoing_request' && (
                     <button disabled className="flex-1 md:flex-none px-[12px] h-[36px] bg-bg-secondary border border-border-subtle text-text-sec rounded-[8px] text-[13px] font-medium flex items-center justify-center gap-2 cursor-not-allowed">
                       <Clock className="w-4 h-4" /> Request Sent
                     </button>
                   )}

                   {relationship === 'incoming_request' && requestId && (
                     <>
                       <button onClick={async () => {
                           const ok = await respondToRequest(requestId, targetProfile.id, 'accepted');
                           if (ok) setRelationship('friend');
                         }}
                         className="flex-1 md:flex-none px-[12px] h-[36px] bg-[#12B76A] text-white rounded-[8px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#0E9F5D] transition-all shadow-sm">
                         <Check className="w-4 h-4" /> Accept
                       </button>
                       <button onClick={async () => {
                           const ok = await respondToRequest(requestId, targetProfile.id, 'declined');
                           if (ok) setRelationship('none');
                         }}
                         className="px-[12px] h-[36px] bg-bg-secondary border border-border-subtle text-text-sec rounded-[8px] text-[13px] font-medium hover:bg-[#EAECF0] dark:hover:bg-[rgba(255,255,255,0.08)] transition-all flex items-center justify-center">
                         <XIcon className="w-4 h-4" />
                       </button>
                     </>
                   )}

                   {relationship === 'friend' && (
                     <>
                       <button onClick={handleStartChat} disabled={isStartingChat} className="flex-1 md:flex-none px-[12px] h-[36px] bg-brand text-white rounded-[8px] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-brand-dark transition-all shadow-sm">
                         {isStartingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                         Message
                       </button>
                       <button onClick={async () => {
                           if (confirm('Remove ' + (targetProfile.display_name || 'this user') + ' from friends?')) {
                             const ok = await removeFriend(targetProfile.id);
                             if (ok) setRelationship('none');
                           }
                         }}
                         className="px-[12px] h-[36px] bg-bg-surface border border-[#F04438]/20 text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-[#4A1519]/20 rounded-[8px] text-[13px] font-medium transition-all flex items-center justify-center">
                         Remove
                       </button>
                     </>
                   )}
                   
                   <button className="p-2 bg-bg-surface border border-border-subtle text-text-sec hover:text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-[#4A1519]/20 rounded-[8px] transition-colors shadow-sm" title="Block User">
                     <ShieldAlert className="w-4 h-4" />
                   </button>
                 </div>
               )}
            </div>
            
            <div className="space-y-4">
              <div>
                 <h1 className="text-[18px] font-bold text-text-main tracking-tight break-words line-clamp-2">
                   {targetProfile.display_name || 'User'}
                 </h1>
                 <p className="text-[12px] text-text-sec mt-0.5 truncate">
                   @{targetProfile.username || 'unknown'}
                 </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-text-sec font-medium">
                 <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Joined {targetProfile.created_at ? format(new Date(targetProfile.created_at), 'MMMM yyyy') : 'Unknown'}
                 </div>
              </div>
              
              {targetProfile.bio && (
                 <div className="pt-5 mt-5 border-t border-border-subtle">
                    <h3 className="text-[12px] font-semibold text-text-sec uppercase tracking-wider mb-2">About</h3>
                    <p className="text-[14px] text-text-main whitespace-pre-wrap leading-relaxed">
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
