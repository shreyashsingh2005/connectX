'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useFriendActions } from '@/hooks/useFriendActions';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, MessageSquare, UserPlus, Check, X as XIcon, Clock, ShieldAlert, Calendar, Search, MoreHorizontal, Copy, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatLastSeen } from '@/lib/utils';

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
  
  const [activeTab, setActiveTab] = useState<'about' | 'activity'>('about');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchProfileAndStatus() {
      if (!username) {
        setLoading(false);
        return;
      }
      
      setLoading(true);

      try {
        let profile = null;
        
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(username);
        
        if (isUUID) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', username)
            .single();
          profile = data;
        } 
        
        if (!profile) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('username_normalized', username.toLowerCase())
            .single();
          profile = data;
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

  const isMe = myProfile?.id === targetProfile?.id;

  async function handleStartChat() {
    if (!myProfile || !targetProfile) return;
    setIsStartingChat(true);
    try {
      const { data: convId, error } = await supabase.rpc('start_direct_conversation', { 
        other_user_id: targetProfile.id 
      });
      if (error) throw error;
      if (!convId) throw new Error('No conversation ID returned');
      router.push('/chat/' + convId);
    } catch (error: any) {
      toast.error('Could not start conversation');
      console.error(error);
    } finally {
      setIsStartingChat(false);
    }
  }

  function handleCopyUsername() {
    if (!targetProfile?.username) return;
    navigator.clipboard.writeText(targetProfile.username);
    toast.success('Username copied');
    setShowMenu(false);
  }

  async function handleRemoveFriend() {
    if (!targetProfile) return;
    if (confirm('Remove ' + (targetProfile.display_name || 'this user') + ' from friends?')) {
      const ok = await removeFriend(targetProfile.id);
      if (ok) {
        setRelationship('none');
        setShowMenu(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center pt-4 md:pt-8 px-3 md:px-4 bg-[#F7F7FB] dark:bg-[#0B0D12] overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-[820px] flex flex-col gap-4 md:gap-5">
          <div className="w-[36px] h-[36px] md:h-[38px] md:w-[38px] bg-[#FFFFFF] dark:bg-[#11141A] rounded-[9px] md:rounded-[10px] skeleton anim-fade-up delay-0 border border-[#E7E5EC] dark:border-[#252936]" />
          
          <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[18px] md:rounded-[22px] border border-[#E7E5EC] dark:border-[#252936] shadow-sm overflow-hidden w-full anim-fade-up delay-0">
            <div className="h-[115px] sm:h-[135px] md:h-[160px] bg-bg-secondary dark:bg-[#171A21] skeleton" />
            
            <div>
              <div className="px-4 md:px-8">
                <div className="flex flex-col md:flex-row gap-3 md:gap-5">
                  <div className="-mt-[28px] md:-mt-[34px] relative flex-shrink-0 z-10 w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] md:w-[92px] md:h-[92px] rounded-full bg-bg-secondary dark:bg-[#171A21] border-[4px] border-[#FFFFFF] dark:border-[#11141A] skeleton anim-fade-scale delay-80" />
                  
                  <div className="flex flex-col flex-1 pb-2 md:pt-3">
                    <div className="anim-fade-up delay-130">
                      <div className="w-[180px] h-[24px] md:h-[28px] bg-bg-secondary dark:bg-[#171A21] rounded-[6px] skeleton" />
                      <div className="w-[120px] h-[16px] bg-bg-secondary dark:bg-[#171A21] rounded-[4px] skeleton mt-[4px]" />
                      <div className="w-[200px] h-[14px] bg-bg-secondary dark:bg-[#171A21] rounded-[4px] mt-[8px] skeleton" />
                    </div>

                    <div className="flex items-center gap-2 mt-[12px] md:mt-[16px] anim-fade delay-220 w-full sm:w-auto">
                      <div className="flex-1 sm:flex-none w-full sm:w-[120px] h-[38px] md:h-[40px] bg-bg-secondary dark:bg-[#171A21] rounded-[10px] md:rounded-[12px] skeleton" />
                      <div className="w-[38px] h-[38px] md:w-[40px] md:h-[40px] bg-bg-secondary dark:bg-[#171A21] rounded-[10px] md:rounded-[12px] skeleton flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b border-[#E7E5EC] dark:border-[#252936] mt-[16px] md:mt-[20px] px-4 md:px-8 flex gap-6 anim-fade delay-280">
                <div className="w-[48px] h-[44px] md:h-[48px] flex items-center">
                   <div className="w-full h-[16px] bg-bg-secondary dark:bg-[#171A21] rounded skeleton" />
                </div>
                <div className="w-[56px] h-[44px] md:h-[48px] flex items-center">
                   <div className="w-full h-[16px] bg-bg-secondary dark:bg-[#171A21] rounded skeleton" />
                </div>
              </div>

              <div className="px-4 md:px-8 py-6 anim-fade-up delay-280">
                <div className="w-[60px] h-[18px] bg-bg-secondary dark:bg-[#171A21] rounded skeleton mb-[12px]" />
                <div className="w-full h-[14px] bg-bg-secondary dark:bg-[#171A21] rounded skeleton mb-2" />
                <div className="w-3/4 h-[14px] bg-bg-secondary dark:bg-[#171A21] rounded skeleton mb-2" />
                <div className="w-1/2 h-[14px] bg-bg-secondary dark:bg-[#171A21] rounded skeleton" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="flex-1 flex flex-col items-center pt-8 px-4 bg-[#F7F7FB] dark:bg-[#0B0D12] text-center">
        <div className="w-full max-w-[820px] flex flex-col">
          <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[18px] md:rounded-[22px] border border-[#E7E5EC] dark:border-[#252936] p-12 flex flex-col items-center shadow-sm anim-fade-up delay-0">
            <div className="w-[48px] h-[48px] bg-[#F7F7FB] dark:bg-[#171A21] rounded-[14px] flex items-center justify-center mb-4 border border-[#E7E5EC] dark:border-[#252936]">
              <Search className="w-6 h-6 text-[#9A9FAD]" />
            </div>
            <h2 className="text-[18px] font-[700] text-[#17151F] dark:text-[#F5F7FA] mb-2 tracking-tight">User not found</h2>
            <p className="text-[13px] md:text-[14px] text-[#777283] dark:text-[#9A9FAD] mb-6 max-w-[280px]">
              This profile doesn't exist or may have been removed.
            </p>
            <button onClick={() => router.back()} className="px-5 py-2.5 bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] text-[#17151F] dark:text-[#F5F7FA] font-[600] text-[13px] rounded-[10px] hover:bg-[#E7E5EC] dark:hover:bg-[#252936] transition-all">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F7FB] dark:bg-[#0B0D12] overflow-y-auto custom-scrollbar items-center">
      <div className="w-full max-w-[820px] px-3 md:px-4 py-4 md:py-8 flex flex-col">
        
        <button onClick={() => router.back()} aria-label="Go back" className="group flex items-center gap-2.5 text-[#777283] dark:text-[#9A9FAD] hover:text-[#17151F] dark:hover:text-[#F5F7FA] transition-colors mb-4 md:mb-5 w-fit anim-fade-up delay-0">
          <div className="w-[36px] h-[36px] md:h-[38px] md:w-[38px] flex items-center justify-center bg-[#FFFFFF] dark:bg-[#11141A] rounded-[9px] md:rounded-[10px] border border-[#E7E5EC] dark:border-[#252936] shadow-sm group-hover:bg-[#F7F7FB] dark:group-hover:bg-[#171A21] transition-colors">
             <ArrowLeft className="w-[18px] h-[18px]" />
          </div>
          <span className="font-[600] text-[13px] md:text-[14px]">Back</span>
        </button>

        <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[18px] md:rounded-[22px] border border-[#E7E5EC] dark:border-[#252936] shadow-sm overflow-hidden relative z-10 anim-fade-up delay-0">
          {/* COVER */}
          <div className="h-[115px] sm:h-[135px] md:h-[160px] bg-gradient-to-br from-[#F3F0FF] via-[#F5F3FF] to-[#EBE5FF] dark:from-[#131127] dark:via-[#17142B] dark:to-[#1C1635] animate-ambient relative overflow-hidden anim-fade delay-0">
             <div className="absolute inset-0 bg-[#FFFFFF]/10 dark:bg-[#0B0D12]/20 backdrop-blur-[2px]"></div>
          </div>
          
          <div>
            <div className="px-4 md:px-8">
              {/* HEADER SECTION (Avatar, Identity, Actions) */}
              <div className="flex flex-col md:flex-row gap-3 md:gap-5">
                
                {/* AVATAR */}
                <div className="-mt-[28px] md:-mt-[34px] relative flex-shrink-0 z-10 w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] md:w-[92px] md:h-[92px] anim-fade-scale delay-80">
                  <UserAvatar
                    src={targetProfile.avatar_url || ''}
                    name={targetProfile.display_name || 'User'}
                    size="2xl"
                    className="w-full h-full ring-[4px] ring-[#FFFFFF] dark:ring-[#11141A] shadow-sm bg-[#F7F7FB] dark:bg-[#0B0D12]"
                  />
                  {targetProfile.is_online && (
                     <div className="absolute bottom-[2px] right-[2px] md:bottom-[4px] md:right-[4px] w-[14px] h-[14px] md:w-[16px] md:h-[16px] bg-[#12B76A] border-[2.5px] md:border-[3px] border-[#FFFFFF] dark:border-[#11141A] rounded-full"></div>
                  )}
                </div>
                
                {/* IDENTITY & ACTIONS COL */}
                <div className="flex flex-col flex-1 pb-2 md:pt-3">
                   {/* IDENTITY */}
                   <div className="anim-fade-up delay-130">
                     <h1 className="text-[20px] md:text-[24px] font-[700] leading-[1.15] text-[#17151F] dark:text-[#F5F7FA] tracking-tight line-clamp-1">
                       {targetProfile.display_name || 'User'}
                     </h1>
                     <p className="text-[13px] md:text-[14px] text-[#777283] dark:text-[#9A9FAD] mt-[2px] md:mt-[4px]">
                       @{targetProfile.username || 'unknown'}
                     </p>
                     <div className="flex items-center gap-1.5 mt-[4px] md:mt-[6px] text-[12px] md:text-[13px] text-[#777283] dark:text-[#9A9FAD] font-[500]">
                        {targetProfile.is_online ? (
                           <>
                             <div className="w-[7px] h-[7px] rounded-full bg-[#12B76A]" />
                             <span className="text-[#12B76A]">Online</span>
                           </>
                        ) : (
                           <>
                             <div className="w-[7px] h-[7px] rounded-full bg-[#9A9FAD] dark:bg-[#4B5563]" />
                             <span>Offline</span>
                           </>
                        )}
                        <span>·</span>
                        <span>Joined {targetProfile.created_at ? format(new Date(targetProfile.created_at), 'MMM yyyy') : 'Unknown'}</span>
                     </div>
                   </div>

                   {/* ACTIONS */}
                   <div className="flex flex-wrap items-center gap-2 mt-[12px] md:mt-[16px] anim-fade delay-220">
                     {!isMe && (
                       <>
                         {relationship === 'none' && (
                           <button onClick={async () => {
                               const ok = await sendFriendRequest(targetProfile.id);
                               if (ok) setRelationship('outgoing_request');
                             }}
                             className="flex-1 sm:flex-none px-5 h-[38px] md:h-[40px] bg-[#17151F] dark:bg-[#F5F7FA] text-[#FFFFFF] dark:text-[#17151F] rounded-[10px] md:rounded-[12px] text-[13px] font-[600] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm">
                             <UserPlus className="w-[16px] h-[16px]" /> Add Friend
                           </button>
                         )}

                         {relationship === 'outgoing_request' && (
                           <button disabled className="flex-1 sm:flex-none px-5 h-[38px] md:h-[40px] bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] text-[#777283] dark:text-[#9A9FAD] rounded-[10px] md:rounded-[12px] text-[13px] font-[600] flex items-center justify-center gap-2 cursor-not-allowed">
                             <Clock className="w-[16px] h-[16px]" /> Request Sent
                           </button>
                         )}

                         {relationship === 'incoming_request' && requestId && (
                           <>
                             <button onClick={async () => {
                                 const ok = await respondToRequest(requestId, targetProfile.id, 'accepted');
                                 if (ok) setRelationship('friend');
                               }}
                               className="flex-1 sm:flex-none px-5 h-[38px] md:h-[40px] bg-[#12B76A] hover:bg-[#0E9F5D] active:scale-[0.98] text-white rounded-[10px] md:rounded-[12px] text-[13px] font-[600] flex items-center justify-center gap-2 transition-all shadow-sm">
                               <Check className="w-[16px] h-[16px]" /> Accept
                             </button>
                             <button onClick={async () => {
                                 const ok = await respondToRequest(requestId, targetProfile.id, 'declined');
                                 if (ok) setRelationship('none');
                               }}
                               aria-label="Decline"
                               className="px-3 h-[38px] md:h-[40px] bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] text-[#777283] dark:text-[#9A9FAD] rounded-[10px] md:rounded-[12px] hover:bg-[#E7E5EC] dark:hover:bg-[rgba(255,255,255,0.08)] active:scale-[0.98] transition-all flex items-center justify-center">
                               <XIcon className="w-[16px] h-[16px]" />
                             </button>
                           </>
                         )}

                         {relationship === 'friend' && (
                           <button onClick={handleStartChat} disabled={isStartingChat} className="flex-1 sm:flex-none px-6 h-[38px] md:h-[40px] bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.98] text-white rounded-[10px] md:rounded-[12px] text-[13px] font-[600] flex items-center justify-center gap-2 transition-all shadow-sm">
                             {isStartingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-[16px] h-[16px]" />}
                             Message
                           </button>
                         )}
                         
                         <div ref={menuRef} className="relative flex-shrink-0">
                           <button onClick={() => setShowMenu(!showMenu)} aria-label="More options" className="w-[38px] h-[38px] md:w-[40px] md:h-[40px] flex items-center justify-center bg-[#FFFFFF] dark:bg-[#11141A] border border-[#E7E5EC] dark:border-[#252936] text-[#777283] dark:text-[#9A9FAD] hover:text-[#17151F] dark:hover:text-[#F5F7FA] hover:bg-[#F7F7FB] dark:hover:bg-[#171A21] rounded-[10px] md:rounded-[12px] transition-colors shadow-sm">
                             <MoreHorizontal className="w-[18px] h-[18px]" />
                           </button>

                           {showMenu && (
                             <div className="absolute top-[44px] md:top-[48px] right-0 w-[180px] md:w-[200px] bg-[#FFFFFF] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] rounded-[10px] md:rounded-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50">
                               <button onClick={handleCopyUsername} className="w-full px-4 py-2.5 md:py-3 flex items-center gap-3 text-[13px] md:text-[14px] font-[500] text-[#17151F] dark:text-[#F5F7FA] hover:bg-[#F7F7FB] dark:hover:bg-[#252936] transition-colors">
                                 <Copy className="w-[16px] h-[16px] text-[#777283] dark:text-[#9A9FAD]" /> Copy username
                               </button>
                               {relationship === 'friend' && (
                                 <button onClick={handleRemoveFriend} className="w-full px-4 py-2.5 md:py-3 flex items-center gap-3 text-[13px] md:text-[14px] font-[500] text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-[#4A1519]/20 transition-colors">
                                   <UserMinus className="w-[16px] h-[16px]" /> Remove friend
                                 </button>
                               )}
                               <button className="w-full px-4 py-2.5 md:py-3 flex items-center gap-3 text-[13px] md:text-[14px] font-[500] text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-[#4A1519]/20 transition-colors">
                                 <ShieldAlert className="w-[16px] h-[16px]" /> Block user
                               </button>
                             </div>
                           )}
                         </div>
                       </>
                     )}
                     {isMe && (
                       <button onClick={() => router.push('/settings')} className="flex-1 sm:flex-none px-5 h-[38px] md:h-[40px] bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] text-[#17151F] dark:text-[#F5F7FA] rounded-[10px] md:rounded-[12px] text-[13px] font-[600] flex items-center justify-center hover:bg-[#E7E5EC] dark:hover:bg-[#252936] transition-all shadow-sm">
                         Edit Profile
                       </button>
                     )}
                   </div>

                </div>
              </div>
            </div>

            {/* TABS */}
            <div className="border-b border-[#E7E5EC] dark:border-[#252936] mt-[16px] md:mt-[20px] px-4 md:px-8 flex gap-6 anim-fade delay-280">
              <button 
                onClick={() => setActiveTab('about')}
                className={cn(
                  "h-[44px] md:h-[48px] relative text-[14px] md:text-[15px] font-[600] transition-colors flex items-center",
                  activeTab === 'about' ? "text-[#17151F] dark:text-[#F5F7FA]" : "text-[#777283] dark:text-[#9A9FAD] hover:text-[#17151F] dark:hover:text-[#F5F7FA]"
                )}
              >
                About
                {activeTab === 'about' && (
                  <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#8B5CF6] rounded-t-full" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('activity')}
                className={cn(
                  "h-[44px] md:h-[48px] relative text-[14px] md:text-[15px] font-[600] transition-colors flex items-center",
                  activeTab === 'activity' ? "text-[#17151F] dark:text-[#F5F7FA]" : "text-[#777283] dark:text-[#9A9FAD] hover:text-[#17151F] dark:hover:text-[#F5F7FA]"
                )}
              >
                Activity
                {activeTab === 'activity' && (
                  <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#8B5CF6] rounded-t-full" />
                )}
              </button>
            </div>

            {/* CONTENT */}
            <div className="px-4 md:px-8 py-6 min-h-[160px] anim-fade-up delay-280">
              {activeTab === 'about' && (
                <div className="animate-in fade-in duration-200">
                  <h3 className="text-[15px] md:text-[16px] font-[700] text-[#17151F] dark:text-[#F5F7FA] mb-[12px]">About</h3>
                  {targetProfile.bio ? (
                    <p className="text-[13px] md:text-[14px] text-[#777283] dark:text-[#9A9FAD] whitespace-pre-wrap leading-[1.5] max-w-2xl">
                      {targetProfile.bio}
                    </p>
                  ) : (
                    <p className="text-[13px] md:text-[14px] text-[#777283] dark:text-[#9A9FAD] italic">No bio added yet.</p>
                  )}
                </div>
              )}
              {activeTab === 'activity' && (
                <div className="animate-in fade-in duration-200">
                  <h3 className="text-[15px] md:text-[16px] font-[700] text-[#17151F] dark:text-[#F5F7FA] mb-[12px]">Activity</h3>
                  
                  {targetProfile.last_seen || targetProfile.created_at ? (
                    <div className="flex flex-col gap-3">
                      {targetProfile.created_at && (
                        <div className="flex items-center gap-3 text-[13px] md:text-[14px] text-[#17151F] dark:text-[#F5F7FA]">
                          <Calendar className="w-[16px] h-[16px] text-[#777283] dark:text-[#9A9FAD]" />
                          <span>Joined connectX in {format(new Date(targetProfile.created_at), 'MMMM yyyy')}</span>
                        </div>
                      )}
                      {targetProfile.last_seen && (
                        <div className="flex items-center gap-3 text-[13px] md:text-[14px] text-[#17151F] dark:text-[#F5F7FA]">
                          <Clock className="w-[16px] h-[16px] text-[#777283] dark:text-[#9A9FAD]" />
                          <span>{targetProfile.is_online ? 'Currently online' : formatLastSeen(targetProfile.last_seen)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[13px] md:text-[14px] text-[#777283] dark:text-[#9A9FAD] italic">No recent activity.</p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}