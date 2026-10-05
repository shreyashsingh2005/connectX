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
        
        // 1. First, check if it's a valid UUID (which is our canonical ID)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(username);
        
        if (isUUID) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', username)
            .single();
          profile = data;
        } 
        
        // 2. If not a UUID (backward compatibility for old username links), or if UUID lookup failed
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
        <div className="w-full max-w-[820px] flex flex-col gap-4">
          <div className="w-[80px] h-[36px] md:h-[40px] bg-[#FFFFFF] dark:bg-[#11141A] rounded-[10px] skeleton profile-enter delay-0" />
          
          <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[18px] md:rounded-[22px] border border-[#E7E5EC] dark:border-[#252936] overflow-hidden w-full shadow-sm profile-enter delay-80">
            <div className="h-[130px] md:h-[180px] bg-bg-secondary dark:bg-[#171A21] skeleton" />
            <div className="px-4 md:px-8 pb-8 relative">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 relative -mt-[42px] md:-mt-[56px] z-10">
                <div className="w-[84px] h-[84px] md:w-[116px] md:h-[116px] rounded-full bg-bg-secondary dark:bg-[#171A21] border-[4px] md:border-[5px] border-[#FFFFFF] dark:border-[#11141A] skeleton flex-shrink-0" />
                
                <div className="flex flex-col gap-2 flex-1 pt-2 sm:pt-0 sm:pb-2">
                  <div className="w-[180px] h-[28px] bg-bg-secondary dark:bg-[#171A21] rounded-[6px] skeleton profile-enter delay-130" />
                  <div className="w-[120px] h-[16px] bg-bg-secondary dark:bg-[#171A21] rounded-[4px] skeleton profile-enter delay-170" />
                  <div className="w-[200px] h-[16px] bg-bg-secondary dark:bg-[#171A21] rounded-[4px] mt-2 skeleton profile-enter delay-170" />
                </div>

                <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:pb-2 profile-enter delay-220 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none w-full sm:w-[120px] h-[40px] md:h-[44px] bg-bg-secondary dark:bg-[#171A21] rounded-[10px] md:rounded-[12px] skeleton" />
                  <div className="w-[40px] h-[40px] md:w-[44px] md:h-[44px] bg-bg-secondary dark:bg-[#171A21] rounded-[10px] md:rounded-[12px] skeleton flex-shrink-0" />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E7E5EC] dark:border-[#252936] profile-enter delay-280">
                <div className="flex gap-6 mb-6">
                  <div className="w-[60px] h-[20px] bg-bg-secondary dark:bg-[#171A21] rounded skeleton" />
                  <div className="w-[60px] h-[20px] bg-bg-secondary dark:bg-[#171A21] rounded skeleton" />
                </div>
                <div className="space-y-3">
                  <div className="w-full h-[14px] bg-bg-secondary dark:bg-[#171A21] rounded skeleton" />
                  <div className="w-3/4 h-[14px] bg-bg-secondary dark:bg-[#171A21] rounded skeleton" />
                  <div className="w-1/2 h-[14px] bg-bg-secondary dark:bg-[#171A21] rounded skeleton" />
                </div>
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
          <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[22px] border border-[#E7E5EC] dark:border-[#252936] p-12 flex flex-col items-center shadow-sm profile-enter delay-0">
            <div className="w-16 h-16 bg-[#F7F7FB] dark:bg-[#171A21] rounded-[16px] flex items-center justify-center mb-5">
              <Search className="w-6 h-6 text-[#9A9FAD]" />
            </div>
            <h2 className="text-[20px] font-[700] text-[#17151F] dark:text-[#F5F7FA] mb-2 tracking-tight">User not found</h2>
            <p className="text-[14px] text-[#777283] dark:text-[#9A9FAD] mb-8 max-w-[280px]">
              This profile doesn't exist or may have been removed.
            </p>
            <button onClick={() => router.back()} className="px-6 py-2.5 bg-[#F7F7FB] dark:bg-[#171A21] text-[#17151F] dark:text-[#F5F7FA] font-[600] text-[14px] rounded-[10px] hover:opacity-80 transition-opacity">
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
        
        <button onClick={() => router.back()} aria-label="Go back" className="group flex items-center gap-2 text-[#777283] dark:text-[#9A9FAD] hover:text-[#17151F] dark:hover:text-[#F5F7FA] transition-colors mb-4 md:mb-6 w-fit profile-enter delay-0">
          <div className="w-[36px] h-[36px] md:h-[40px] md:w-[40px] flex items-center justify-center bg-[#FFFFFF] dark:bg-[#11141A] rounded-[9px] md:rounded-[10px] border border-[#E7E5EC] dark:border-[#252936] shadow-sm group-hover:bg-[#F7F7FB] dark:group-hover:bg-[#171A21] transition-colors">
             <ArrowLeft className="w-[18px] h-[18px]" />
          </div>
          <span className="font-[600] text-[14px] hidden sm:block">Back</span>
        </button>

        <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[18px] md:rounded-[22px] border border-[#E7E5EC] dark:border-[#252936] shadow-sm overflow-hidden relative z-10 profile-enter delay-80">
          {/* COVER / BANNER */}
          <div className="h-[130px] md:h-[180px] bg-gradient-to-br from-[#8B5CF6]/15 via-[#EC4899]/10 to-[#8B5CF6]/15 dark:from-[#312E81]/40 dark:via-[#4C1D95]/30 dark:to-[#1E1B4B]/40 animate-ambient relative overflow-hidden profile-enter delay-0">
             <div className="absolute inset-0 bg-[#FFFFFF]/20 dark:bg-[#0B0D12]/20 backdrop-blur-[4px]"></div>
          </div>
          
          <div className="px-4 md:px-8 pb-8 relative">
            
            {/* AVATAR AND INFO ROW */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 relative z-20 -mt-[42px] md:-mt-[56px]">
               
               {/* Avatar */}
               <div className="relative flex-shrink-0 profile-enter delay-80">
                  <UserAvatar
                    src={targetProfile.avatar_url || ''}
                    name={targetProfile.display_name || 'User'}
                    size="2xl"
                    className="w-[84px] h-[84px] md:w-[116px] md:h-[116px] ring-[4px] md:ring-[5px] ring-[#FFFFFF] dark:ring-[#11141A] shadow-[0_4px_12px_rgba(0,0,0,0.05)] bg-[#F7F7FB] dark:bg-[#0B0D12]"
                  />
                  {targetProfile.is_online && (
                     <div className="absolute bottom-1 right-1 md:bottom-[6px] md:right-[6px] w-[18px] h-[18px] md:w-[22px] md:h-[22px] bg-[#12B76A] border-[3px] md:border-[4px] border-[#FFFFFF] dark:border-[#11141A] rounded-full"></div>
                  )}
               </div>
               
               {/* Name & Username Block */}
               <div className="flex flex-col flex-1 pb-1 md:pb-2">
                 <h1 className="text-[20px] md:text-[26px] font-[700] text-[#17151F] dark:text-[#F5F7FA] tracking-tight line-clamp-1 profile-enter delay-130">
                   {targetProfile.display_name || 'User'}
                 </h1>
                 <p className="text-[14px] text-[#777283] dark:text-[#9A9FAD] mt-[2px] profile-enter delay-170">
                   @{targetProfile.username || 'unknown'}
                 </p>
                 
                 <div className="flex items-center gap-2 mt-2 md:mt-2.5 text-[12px] md:text-[13px] text-[#777283] dark:text-[#9A9FAD] font-[500] profile-enter delay-170">
                    {targetProfile.is_online ? (
                       <div className="flex items-center gap-1.5 text-[#12B76A]">
                          <div className="w-[7px] h-[7px] rounded-full bg-[#12B76A]" />
                          Online
                       </div>
                    ) : (
                       <div className="flex items-center gap-1.5">
                          <div className="w-[7px] h-[7px] rounded-full bg-[#9A9FAD] dark:bg-[#4B5563]" />
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
               <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:pb-2 w-full sm:w-auto profile-enter delay-220 relative">
                 {!isMe && (
                   <>
                     {relationship === 'none' && (
                       <button onClick={async () => {
                           const ok = await sendFriendRequest(targetProfile.id);
                           if (ok) setRelationship('outgoing_request');
                         }}
                         className="flex-1 sm:flex-none px-6 h-[40px] md:h-[44px] bg-[#17151F] dark:bg-[#F5F7FA] text-[#FFFFFF] dark:text-[#17151F] rounded-[10px] md:rounded-[12px] text-[14px] font-[600] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm">
                         <UserPlus className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" /> Add Friend
                       </button>
                     )}

                     {relationship === 'outgoing_request' && (
                       <button disabled className="flex-1 sm:flex-none px-6 h-[40px] md:h-[44px] bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] text-[#777283] dark:text-[#9A9FAD] rounded-[10px] md:rounded-[12px] text-[14px] font-[600] flex items-center justify-center gap-2 cursor-not-allowed">
                         <Clock className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" /> Request Sent
                       </button>
                     )}

                     {relationship === 'incoming_request' && requestId && (
                       <>
                         <button onClick={async () => {
                             const ok = await respondToRequest(requestId, targetProfile.id, 'accepted');
                             if (ok) setRelationship('friend');
                           }}
                           className="flex-1 sm:flex-none px-6 h-[40px] md:h-[44px] bg-[#12B76A] hover:bg-[#0E9F5D] active:scale-[0.98] text-white rounded-[10px] md:rounded-[12px] text-[14px] font-[600] flex items-center justify-center gap-2 transition-all shadow-sm">
                           <Check className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" /> Accept
                         </button>
                         <button onClick={async () => {
                             const ok = await respondToRequest(requestId, targetProfile.id, 'declined');
                             if (ok) setRelationship('none');
                           }}
                           aria-label="Decline"
                           className="px-3 h-[40px] md:h-[44px] bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] text-[#777283] dark:text-[#9A9FAD] rounded-[10px] md:rounded-[12px] hover:bg-[#E7E5EC] dark:hover:bg-[rgba(255,255,255,0.08)] active:scale-[0.98] transition-all flex items-center justify-center">
                           <XIcon className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" />
                         </button>
                       </>
                     )}

                     {relationship === 'friend' && (
                       <button onClick={handleStartChat} disabled={isStartingChat} className="flex-1 sm:flex-none px-6 h-[40px] md:h-[44px] bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.98] text-white rounded-[10px] md:rounded-[12px] text-[14px] font-[600] flex items-center justify-center gap-2 transition-all shadow-sm">
                         {isStartingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" />}
                         Message
                       </button>
                     )}
                     
                     <div ref={menuRef} className="relative flex-shrink-0">
                       <button onClick={() => setShowMenu(!showMenu)} aria-label="More options" className="w-[40px] h-[40px] md:w-[44px] md:h-[44px] flex items-center justify-center bg-[#FFFFFF] dark:bg-[#11141A] border border-[#E7E5EC] dark:border-[#252936] text-[#777283] dark:text-[#9A9FAD] hover:text-[#17151F] dark:hover:text-[#F5F7FA] hover:bg-[#F7F7FB] dark:hover:bg-[#171A21] rounded-[10px] md:rounded-[12px] transition-colors shadow-sm">
                         <MoreHorizontal className="w-[18px] h-[18px]" />
                       </button>

                       {showMenu && (
                         <div className="absolute top-[48px] md:top-[52px] right-0 w-[200px] bg-[#FFFFFF] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] rounded-[12px] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50">
                           <button onClick={handleCopyUsername} className="w-full px-4 py-3 flex items-center gap-3 text-[14px] font-[500] text-[#17151F] dark:text-[#F5F7FA] hover:bg-[#F7F7FB] dark:hover:bg-[#252936] transition-colors">
                             <Copy className="w-[16px] h-[16px] text-[#777283] dark:text-[#9A9FAD]" /> Copy username
                           </button>
                           {relationship === 'friend' && (
                             <button onClick={handleRemoveFriend} className="w-full px-4 py-3 flex items-center gap-3 text-[14px] font-[500] text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-[#4A1519]/20 transition-colors">
                               <UserMinus className="w-[16px] h-[16px]" /> Remove friend
                             </button>
                           )}
                           <button className="w-full px-4 py-3 flex items-center gap-3 text-[14px] font-[500] text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-[#4A1519]/20 transition-colors">
                             <ShieldAlert className="w-[16px] h-[16px]" /> Block user
                           </button>
                         </div>
                       )}
                     </div>
                   </>
                 )}
                 {isMe && (
                   <button onClick={() => router.push('/settings')} className="flex-1 sm:flex-none px-6 h-[40px] md:h-[44px] bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] text-[#17151F] dark:text-[#F5F7FA] rounded-[10px] md:rounded-[12px] text-[14px] font-[600] flex items-center justify-center hover:bg-[#E7E5EC] dark:hover:bg-[#252936] transition-all shadow-sm">
                     Edit Profile
                   </button>
                 )}
               </div>
            </div>
            
            {/* TABS & SECTIONS */}
            <div className="mt-8 profile-enter delay-280">
              <div className="flex items-center gap-6 border-b border-[#E7E5EC] dark:border-[#252936]">
                <button 
                  onClick={() => setActiveTab('about')}
                  className={cn(
                    "pb-3 text-[15px] font-[600] transition-colors relative",
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
                    "pb-3 text-[15px] font-[600] transition-colors relative",
                    activeTab === 'activity' ? "text-[#17151F] dark:text-[#F5F7FA]" : "text-[#777283] dark:text-[#9A9FAD] hover:text-[#17151F] dark:hover:text-[#F5F7FA]"
                  )}
                >
                  Activity
                  {activeTab === 'activity' && (
                    <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#8B5CF6] rounded-t-full" />
                  )}
                </button>
              </div>

              <div className="py-6 min-h-[120px]">
                {activeTab === 'about' && (
                  <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                    {targetProfile.bio ? (
                      <p className="text-[14px] text-[#777283] dark:text-[#9A9FAD] whitespace-pre-wrap leading-[1.6] max-w-2xl">
                        {targetProfile.bio}
                      </p>
                    ) : (
                      <p className="text-[14px] text-[#777283] dark:text-[#9A9FAD] italic">No bio added yet.</p>
                    )}
                  </div>
                )}
                {activeTab === 'activity' && (
                  <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-[14px] text-[#17151F] dark:text-[#F5F7FA]">
                        <div className="w-8 h-8 rounded-full bg-[#F7F7FB] dark:bg-[#171A21] flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-[#777283] dark:text-[#9A9FAD]" />
                        </div>
                        <span>Joined connectX in {targetProfile.created_at ? format(new Date(targetProfile.created_at), 'MMMM yyyy') : 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[14px] text-[#17151F] dark:text-[#F5F7FA]">
                        <div className="w-8 h-8 rounded-full bg-[#F7F7FB] dark:bg-[#171A21] flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-[#777283] dark:text-[#9A9FAD]" />
                        </div>
                        <span>{targetProfile.is_online ? 'Currently online' : (targetProfile.last_seen ? formatLastSeen(targetProfile.last_seen) : 'Last seen unknown')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}