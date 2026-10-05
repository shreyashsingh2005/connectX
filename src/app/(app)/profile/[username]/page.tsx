'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useFriendActions } from '@/hooks/useFriendActions';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, MessageSquare, UserPlus, Check, X as XIcon, Clock, ShieldAlert, Calendar, Search, MoreHorizontal } from 'lucide-react';
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
          {/* COVER / BANNER */}
          <div className="h-32 md:h-48 bg-gradient-to-r from-[#8B5CF6]/20 to-[#EC4899]/20 dark:from-[#8B5CF6]/30 dark:to-[#EC4899]/30 relative">
             <div className="absolute inset-0 bg-[#F8FAFC]/30 dark:bg-bg-primary/30 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="px-6 md:px-10 pb-10 relative">
            
            {/* AVATAR AND INFO ROW */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 relative z-20 -mt-12 md:-mt-16">
               
               {/* Avatar */}
               <div className="relative flex-shrink-0">
                  <UserAvatar
                    src={targetProfile.avatar_url || ''}
                    name={targetProfile.display_name || 'User'}
                    size="2xl"
                    className="w-[96px] h-[96px] md:w-[120px] md:h-[120px] ring-[6px] ring-bg-surface shadow-sm bg-[#EAECF0] dark:bg-bg-surface/5"
                  />
                  {targetProfile.is_online && (
                     <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-6 h-6 md:w-7 md:h-7 bg-[#12B76A] border-4 border-bg-surface rounded-full"></div>
                  )}
               </div>
               
               {/* Name & Username Block */}
               <div className="flex flex-col flex-1 pb-1 md:pb-2">
                 <h1 className="text-[22px] md:text-[24px] font-bold text-text-main tracking-tight line-clamp-1">
                   {targetProfile.display_name || 'User'}
                 </h1>
                 <p className="text-[14px] text-text-sec mt-0.5">
                   @{targetProfile.username || 'unknown'}
                 </p>
                 
                 <div className="flex items-center gap-2 mt-2.5 text-[13px] text-text-sec font-medium">
                    {targetProfile.is_online ? (
                       <div className="flex items-center gap-1.5 text-[#12B76A]">
                          <div className="w-2 h-2 rounded-full bg-[#12B76A]" />
                          Online
                       </div>
                    ) : (
                       <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#9A9FAD] dark:bg-border-subtle" />
                          Offline
                       </div>
                    )}
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      Joined {targetProfile.created_at ? format(new Date(targetProfile.created_at), 'MMM yyyy') : 'Unknown'}
                    </div>
                 </div>
               </div>
               
               {/* ACTION BUTTONS (Message / More) */}
               <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:pb-2 w-full sm:w-auto">
                 {!isMe && (
                   <>
                     {relationship === 'none' && (
                       <button onClick={async () => {
                           const ok = await sendFriendRequest(targetProfile.id);
                           if (ok) setRelationship('outgoing_request');
                         }}
                         className="flex-1 sm:flex-none px-6 h-[40px] bg-[#101828] dark:bg-[#F5F7FA] text-white dark:text-text-main rounded-[10px] text-[13px] font-[600] flex items-center justify-center gap-2 hover:bg-[#1D2939] dark:hover:bg-bg-surface transition-all shadow-sm">
                         <UserPlus className="w-4 h-4" /> Add Friend
                       </button>
                     )}

                     {relationship === 'outgoing_request' && (
                       <button disabled className="flex-1 sm:flex-none px-6 h-[40px] bg-bg-secondary border border-border-subtle text-text-sec rounded-[10px] text-[13px] font-[600] flex items-center justify-center gap-2 cursor-not-allowed">
                         <Clock className="w-4 h-4" /> Request Sent
                       </button>
                     )}

                     {relationship === 'incoming_request' && requestId && (
                       <>
                         <button onClick={async () => {
                             const ok = await respondToRequest(requestId, targetProfile.id, 'accepted');
                             if (ok) setRelationship('friend');
                           }}
                           className="flex-1 sm:flex-none px-6 h-[40px] bg-[#12B76A] text-white rounded-[10px] text-[13px] font-[600] flex items-center justify-center gap-2 hover:bg-[#0E9F5D] transition-all shadow-sm">
                           <Check className="w-4 h-4" /> Accept
                         </button>
                         <button onClick={async () => {
                             const ok = await respondToRequest(requestId, targetProfile.id, 'declined');
                             if (ok) setRelationship('none');
                           }}
                           className="px-3 h-[40px] bg-bg-secondary border border-border-subtle text-text-sec rounded-[10px] text-[13px] font-[600] hover:bg-[#EAECF0] dark:hover:bg-[rgba(255,255,255,0.08)] transition-all flex items-center justify-center">
                           <XIcon className="w-4 h-4" />
                         </button>
                       </>
                     )}

                     {relationship === 'friend' && (
                       <button onClick={handleStartChat} disabled={isStartingChat} className="flex-1 sm:flex-none px-8 h-[40px] bg-brand text-white rounded-[10px] text-[14px] font-[600] flex items-center justify-center gap-2 hover:bg-brand-dark transition-all shadow-sm">
                         {isStartingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-[18px] h-[18px]" />}
                         Message
                       </button>
                     )}
                     
                     <button className="w-[40px] h-[40px] flex items-center justify-center bg-bg-surface border border-border-subtle text-text-sec hover:text-text-main hover:bg-bg-secondary rounded-[10px] transition-colors shadow-sm flex-shrink-0" title="More Options">
                       <MoreHorizontal className="w-[18px] h-[18px]" />
                     </button>
                   </>
                 )}
                 {isMe && (
                   <button onClick={() => router.push('/settings')} className="flex-1 sm:flex-none px-6 h-[40px] bg-bg-secondary border border-border-subtle text-text-main rounded-[10px] text-[13px] font-[600] flex items-center justify-center hover:bg-bg-surface transition-all shadow-sm">
                     Edit Profile
                   </button>
                 )}
               </div>
            </div>
            
            {/* TABS & SECTIONS */}
            <div className="mt-8 pt-8 border-t border-border-subtle">
              <div className="space-y-10">
                {/* About Section */}
                <div>
                  <h3 className="text-[15px] font-bold text-text-main mb-2">About</h3>
                  <div className="h-[2px] w-8 bg-brand rounded-full mb-4"></div>
                  {targetProfile.bio ? (
                    <p className="text-[14px] text-text-sec whitespace-pre-wrap leading-relaxed max-w-2xl">
                      {targetProfile.bio}
                    </p>
                  ) : (
                    <p className="text-[14px] text-text-muted italic">No bio provided.</p>
                  )}
                </div>

                {/* Activity Section */}
                <div>
                  <h3 className="text-[15px] font-bold text-text-main mb-2">Activity</h3>
                  <div className="h-[2px] w-8 bg-brand rounded-full mb-4"></div>
                  <p className="text-[14px] text-text-muted italic">
                    No recent activity.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}