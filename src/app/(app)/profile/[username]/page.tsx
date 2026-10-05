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
    let isMounted = true;

    async function fetchProfileAndStatus() {
      if (!username) {
        if (isMounted) setLoading(false);
        return;
      }
      
      // Prevent profile blink by only loading if it's a completely different user
      if (!targetProfile || (targetProfile.id !== username && targetProfile.username?.toLowerCase() !== username.toLowerCase())) {
        if (isMounted) setLoading(true);
      }

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

        if (!isMounted) return;
        setTargetProfile(profile || null);

        if (profile && myProfile && profile.id && myProfile.id && profile.id !== myProfile.id) {
          const { data: friendships } = await supabase
            .from('friendships')
            .select('*')
            .or('and(user_id.eq.' + myProfile.id + ',friend_id.eq.' + profile.id + '),and(user_id.eq.' + profile.id + ',friend_id.eq.' + myProfile.id + ')')
            .limit(1);

          if (friendships && friendships.length > 0) {
            setRelationship('friend');
          } else {
            const { data: reqs } = await supabase
              .from('friend_requests')
              .select('*')
              .or('and(sender_id.eq.' + myProfile.id + ',receiver_id.eq.' + profile.id + '),and(sender_id.eq.' + profile.id + ',receiver_id.eq.' + myProfile.id + ')')
              .eq('status', 'pending')
              .limit(1);

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
        if (isMounted) setLoading(false);
      }
    }

    fetchProfileAndStatus();
    
    return () => {
      isMounted = false;
    };
  }, [username, myProfile?.id, supabase]);

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

  // --------------------------------------------------------
  // LOADING SKELETON
  // --------------------------------------------------------
  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-[#F7F7FB] dark:bg-[#0B0D12] overflow-y-auto custom-scrollbar h-[100dvh] pb-[calc(16px+env(safe-area-inset-bottom))]">
        
        {/* Top Bar Skeleton */}
        <div className="w-full max-w-[820px] mx-auto px-4 pt-4 pb-2 z-20 flex-shrink-0">
          <div className="w-[40px] h-[40px] bg-[#FFFFFF] dark:bg-[#11141A] rounded-[10px] skeleton border border-[#E7E5EC] dark:border-[#252936]" />
        </div>
        
        {/* Profile Surface Skeleton */}
        <div className="w-full max-w-[820px] mx-auto md:bg-[#FFFFFF] md:dark:bg-[#11141A] md:rounded-[24px] md:border md:border-[#E7E5EC] md:dark:border-[#252936] md:shadow-sm md:mb-8 flex flex-col pb-8">
          
          <div className="h-[130px] md:h-[160px] w-full bg-[#E7E5EC] dark:bg-[#171A21] md:rounded-t-[24px] skeleton" />
          
          <div className="flex justify-center -mt-[39px] md:-mt-[48px] relative z-20">
            <div className="w-[78px] h-[78px] md:w-[96px] md:h-[96px] rounded-full skeleton bg-[#E7E5EC] dark:bg-[#171A21] border-[4px] border-[#F7F7FB] dark:border-[#0B0D12] md:border-[#FFFFFF] md:dark:border-[#11141A]" />
          </div>
          
          <div className="flex flex-col items-center mt-3 px-4 w-full">
            <div className="w-[140px] h-[24px] md:h-[28px] bg-[#E7E5EC] dark:bg-[#171A21] rounded-[6px] skeleton" />
            <div className="w-[100px] h-[14px] bg-[#E7E5EC] dark:bg-[#171A21] rounded-[4px] skeleton mt-2" />
            <div className="w-[160px] h-[12px] bg-[#E7E5EC] dark:bg-[#171A21] rounded-[4px] mt-2 skeleton" />
          </div>
          
          <div className="flex flex-row justify-center gap-2 mt-5 px-4 w-full">
            <div className="w-[120px] h-[40px] md:h-[42px] bg-[#E7E5EC] dark:bg-[#171A21] rounded-[10px] skeleton" />
            <div className="w-[40px] h-[40px] md:h-[42px] bg-[#E7E5EC] dark:bg-[#171A21] rounded-[10px] skeleton" />
          </div>
          
          <div className="w-full flex justify-center gap-6 border-b border-[#E7E5EC] dark:border-[#252936] mt-6 px-4">
            <div className="w-[48px] h-[44px] flex items-center">
               <div className="w-full h-[16px] bg-[#E7E5EC] dark:bg-[#171A21] rounded skeleton" />
            </div>
            <div className="w-[56px] h-[44px] flex items-center">
               <div className="w-full h-[16px] bg-[#E7E5EC] dark:bg-[#171A21] rounded skeleton" />
            </div>
          </div>

          <div className="w-full max-w-[600px] mx-auto mt-6 px-4 text-left">
            <div className="w-full h-[14px] bg-[#E7E5EC] dark:bg-[#171A21] rounded skeleton mb-2" />
            <div className="w-3/4 h-[14px] bg-[#E7E5EC] dark:bg-[#171A21] rounded skeleton" />
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------------
  if (!targetProfile) {
    return (
      <div className="flex-1 flex flex-col items-center pt-12 px-4 bg-[#F7F7FB] dark:bg-[#0B0D12] text-center h-[100dvh]">
        <div className="w-full max-w-[820px] flex flex-col">
          <div className="bg-[#FFFFFF] dark:bg-[#11141A] rounded-[24px] border border-[#E7E5EC] dark:border-[#252936] p-12 flex flex-col items-center shadow-sm animate-in fade-in zoom-in-95 duration-300">
            <div className="w-[48px] h-[48px] bg-[#F7F7FB] dark:bg-[#171A21] rounded-[14px] flex items-center justify-center mb-4 border border-[#E7E5EC] dark:border-[#252936]">
              <Search className="w-6 h-6 text-[#9A9FAD]" />
            </div>
            <h2 className="text-[18px] font-[700] text-[#17151F] dark:text-[#F5F7FA] mb-2 tracking-tight">User not found</h2>
            <p className="text-[13px] md:text-[14px] text-[#777283] dark:text-[#9A9FAD] mb-6 max-w-[280px]">
              This profile doesn't exist or may have been removed.
            </p>
            <button onClick={() => router.back()} className="px-5 py-2.5 bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] text-[#17151F] dark:text-[#F5F7FA] font-[600] text-[13px] rounded-[10px] hover:bg-[#E7E5EC] dark:hover:bg-[#252936] transition-colors">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // FULL PROFILE RENDER
  // --------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col bg-[#F7F7FB] dark:bg-[#0B0D12] overflow-y-auto custom-scrollbar h-[100dvh] pb-[calc(16px+env(safe-area-inset-bottom))]">
      
      {/* PROFILE TOP BAR */}
      <div className="w-full max-w-[820px] mx-auto px-4 pt-4 md:pt-6 pb-2 z-20 flex-shrink-0">
        <button 
          onClick={() => router.back()} 
          aria-label="Go back" 
          className="group flex items-center gap-2.5 text-[#777283] dark:text-[#9A9FAD] hover:text-[#17151F] dark:hover:text-[#F5F7FA] transition-colors w-fit"
        >
          <div className="w-[36px] h-[36px] md:w-[40px] md:h-[40px] flex items-center justify-center bg-[#FFFFFF] dark:bg-[#11141A] rounded-[10px] border border-[#E7E5EC] dark:border-[#252936] shadow-sm group-hover:bg-[#F3F0FF] dark:group-hover:bg-[#1C1635] transition-colors">
             <ArrowLeft className="w-[18px] h-[18px]" />
          </div>
          <span className="hidden md:inline font-[600] text-[14px]">Back</span>
        </button>
      </div>

      {/* PROFILE SURFACE */}
      <div className="w-full max-w-[820px] mx-auto md:bg-[#FFFFFF] md:dark:bg-[#11141A] md:rounded-[24px] md:border md:border-[#E7E5EC] md:dark:border-[#252936] md:shadow-sm md:mb-8 flex flex-col pb-8">
        
        {/* COVER */}
        <div className="h-[130px] md:h-[160px] w-full relative bg-gradient-to-br from-[#F3F0FF] via-[#F5F3FF] to-[#EBE5FF] dark:from-[#131127] dark:via-[#17142B] dark:to-[#1C1635] flex-shrink-0 md:rounded-t-[24px] overflow-hidden animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#FFFFFF]/10 dark:bg-[#0B0D12]/20 backdrop-blur-[2px]"></div>
           {/* If connectX adds custom cover photos in the future, render <img src={coverUrl} /> here */}
        </div>
        
        {/* AVATAR (Normal Flow with Negative Margin) */}
        <div className="flex justify-center -mt-[39px] md:-mt-[48px] relative z-20 animate-in fade-in zoom-in-95 duration-400 delay-75 fill-mode-both">
           <div className="relative w-[78px] h-[78px] md:w-[96px] md:h-[96px]">
              <UserAvatar
                src={targetProfile.avatar_url || ''}
                name={targetProfile.display_name || 'User'}
                size="2xl"
                className="w-full h-full ring-[4px] ring-[#F7F7FB] dark:ring-[#0B0D12] md:ring-[#FFFFFF] md:dark:ring-[#11141A] shadow-sm bg-[#FFFFFF] dark:bg-[#11141A]"
              />
              {targetProfile.is_online && (
                 <div className="absolute bottom-[2px] right-[2px] md:bottom-[4px] md:right-[4px] w-[14px] h-[14px] md:w-[16px] md:h-[16px] bg-[#12B76A] border-[3px] border-[#F7F7FB] dark:border-[#0B0D12] md:border-[#FFFFFF] md:dark:border-[#11141A] rounded-full"></div>
              )}
           </div>
        </div>
        
        {/* CENTERED IDENTITY */}
        <div className="flex flex-col items-center text-center mt-3 px-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150 fill-mode-both">
          <h1 className="text-[20px] md:text-[24px] font-[700] leading-tight text-[#17151F] dark:text-[#F5F7FA]">
            {targetProfile.display_name || 'User'}
          </h1>
          <p className="text-[13px] md:text-[14px] text-[#777283] dark:text-[#9A9FAD] mt-[2px]">
            @{targetProfile.username || 'unknown'}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[12px] md:text-[13px] text-[#777283] dark:text-[#9A9FAD] font-[500]">
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

        {/* COMPACT ACTIONS */}
        <div className="flex items-center justify-center gap-2 mt-5 px-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-mode-both">
          {!isMe && (
            <>
              {relationship === 'none' && (
                <button onClick={async () => {
                    const ok = await sendFriendRequest(targetProfile.id);
                    if (ok) setRelationship('outgoing_request');
                  }}
                  className="px-5 h-[40px] md:h-[42px] bg-[#17151F] dark:bg-[#F5F7FA] text-[#FFFFFF] dark:text-[#17151F] rounded-[10px] md:rounded-[12px] text-[14px] font-[600] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm">
                  <UserPlus className="w-[16px] h-[16px]" /> Add Friend
                </button>
              )}

              {relationship === 'outgoing_request' && (
                <button disabled className="px-5 h-[40px] md:h-[42px] bg-[#FFFFFF] md:bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] text-[#777283] dark:text-[#9A9FAD] rounded-[10px] md:rounded-[12px] text-[14px] font-[600] flex items-center justify-center gap-2 cursor-not-allowed shadow-sm">
                  <Clock className="w-[16px] h-[16px]" /> Request Sent
                </button>
              )}

              {relationship === 'incoming_request' && requestId && (
                <>
                  <button onClick={async () => {
                      const ok = await respondToRequest(requestId, targetProfile.id, 'accepted');
                      if (ok) setRelationship('friend');
                    }}
                    className="px-5 h-[40px] md:h-[42px] bg-[#12B76A] hover:bg-[#0E9F5D] active:scale-[0.98] text-white rounded-[10px] md:rounded-[12px] text-[14px] font-[600] flex items-center justify-center gap-2 transition-all shadow-sm">
                    <Check className="w-[16px] h-[16px]" /> Accept
                  </button>
                  <button onClick={async () => {
                      const ok = await respondToRequest(requestId, targetProfile.id, 'declined');
                      if (ok) setRelationship('none');
                    }}
                    aria-label="Decline"
                    className="w-[40px] h-[40px] md:w-[42px] md:h-[42px] bg-[#FFFFFF] md:bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] text-[#777283] dark:text-[#9A9FAD] rounded-[10px] md:rounded-[12px] hover:bg-[#E7E5EC] dark:hover:bg-[rgba(255,255,255,0.08)] active:scale-[0.98] transition-all flex items-center justify-center shadow-sm">
                    <XIcon className="w-[16px] h-[16px]" />
                  </button>
                </>
              )}

              {relationship === 'friend' && (
                <button onClick={handleStartChat} disabled={isStartingChat} className="px-6 h-[40px] md:h-[42px] bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.98] text-white rounded-[10px] md:rounded-[12px] text-[14px] font-[600] flex items-center justify-center gap-2 transition-all shadow-sm">
                  {isStartingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-[16px] h-[16px]" />}
                  Message
                </button>
              )}
              
              {/* RELATIVE WRAPPER FOR OVERFLOW MENU */}
              <div ref={menuRef} className="relative flex-shrink-0">
                <button onClick={() => setShowMenu(!showMenu)} aria-label="More options" className="w-[40px] h-[40px] md:w-[42px] md:h-[42px] flex items-center justify-center bg-[#FFFFFF] md:bg-[#F7F7FB] dark:bg-[#11141A] border border-[#E7E5EC] dark:border-[#252936] text-[#777283] dark:text-[#9A9FAD] hover:text-[#17151F] dark:hover:text-[#F5F7FA] hover:bg-[#F3F0FF] dark:hover:bg-[#171A21] rounded-[10px] md:rounded-[12px] transition-colors shadow-sm">
                  <MoreHorizontal className="w-[18px] h-[18px]" />
                </button>

                {showMenu && (
                  <div className="absolute top-[calc(100%+8px)] right-0 w-[180px] md:w-[200px] bg-[#FFFFFF] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] rounded-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-[50] text-left">
                    <button onClick={handleCopyUsername} className="w-full px-4 py-3 flex items-center gap-3 text-[13px] md:text-[14px] font-[500] text-[#17151F] dark:text-[#F5F7FA] hover:bg-[#F7F7FB] dark:hover:bg-[#252936] transition-colors">
                      <Copy className="w-[16px] h-[16px] text-[#777283] dark:text-[#9A9FAD]" /> Copy username
                    </button>
                    {relationship === 'friend' && (
                      <button onClick={handleRemoveFriend} className="w-full px-4 py-3 flex items-center gap-3 text-[13px] md:text-[14px] font-[500] text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-[#4A1519]/20 transition-colors">
                        <UserMinus className="w-[16px] h-[16px]" /> Remove friend
                      </button>
                    )}
                    <button className="w-full px-4 py-3 flex items-center gap-3 text-[13px] md:text-[14px] font-[500] text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-[#4A1519]/20 transition-colors">
                      <ShieldAlert className="w-[16px] h-[16px]" /> Block user
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {isMe && (
            <button onClick={() => router.push('/settings')} className="px-5 h-[40px] md:h-[42px] bg-[#FFFFFF] md:bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] text-[#17151F] dark:text-[#F5F7FA] rounded-[10px] md:rounded-[12px] text-[14px] font-[600] flex items-center justify-center hover:bg-[#E7E5EC] dark:hover:bg-[#252936] transition-all shadow-sm">
              Edit Profile
            </button>
          )}
        </div>

        {/* NATIVE-STYLE TABS */}
        <div className="w-full flex justify-center gap-6 md:gap-8 border-b border-[#E7E5EC] dark:border-[#252936] mt-6 px-4 animate-in fade-in duration-300 delay-200 fill-mode-both">
          <button 
            onClick={() => setActiveTab('about')}
            className={cn(
              "h-[42px] md:h-[44px] relative text-[14px] md:text-[15px] font-[600] transition-colors flex items-center",
              activeTab === 'about' ? "text-[#8B5CF6]" : "text-[#777283] dark:text-[#9A9FAD] hover:text-[#17151F] dark:hover:text-[#F5F7FA]"
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
              "h-[42px] md:h-[44px] relative text-[14px] md:text-[15px] font-[600] transition-colors flex items-center",
              activeTab === 'activity' ? "text-[#8B5CF6]" : "text-[#777283] dark:text-[#9A9FAD] hover:text-[#17151F] dark:hover:text-[#F5F7FA]"
            )}
          >
            Activity
            {activeTab === 'activity' && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#8B5CF6] rounded-t-full" />
            )}
          </button>
        </div>

        {/* PROFILE DATA CONTENT */}
        <div className="w-full max-w-[600px] mx-auto mt-6 px-4 text-left min-h-[140px] animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300 fill-mode-both">
          {activeTab === 'about' && (
            <div key="about" className="animate-in fade-in slide-in-from-bottom-1 duration-200">
              {targetProfile.bio ? (
                <p className="text-[14px] md:text-[15px] text-[#17151F] dark:text-[#F5F7FA] whitespace-pre-wrap leading-[1.6]">
                  {targetProfile.bio}
                </p>
              ) : (
                <p className="text-[14px] md:text-[15px] text-[#777283] dark:text-[#9A9FAD] italic">No bio added yet.</p>
              )}
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div key="activity" className="animate-in fade-in slide-in-from-bottom-1 duration-200">
              {targetProfile.last_seen || targetProfile.created_at ? (
                <div className="flex flex-col gap-4">
                  {targetProfile.created_at && (
                    <div className="flex items-center gap-3 text-[14px] md:text-[15px] text-[#17151F] dark:text-[#F5F7FA]">
                      <div className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#FFFFFF] md:bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] shadow-sm">
                         <Calendar className="w-[16px] h-[16px] text-[#8B5CF6]" />
                      </div>
                      <span>Joined connectX in {format(new Date(targetProfile.created_at), 'MMMM yyyy')}</span>
                    </div>
                  )}
                  {targetProfile.last_seen && (
                    <div className="flex items-center gap-3 text-[14px] md:text-[15px] text-[#17151F] dark:text-[#F5F7FA]">
                      <div className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#FFFFFF] md:bg-[#F7F7FB] dark:bg-[#171A21] border border-[#E7E5EC] dark:border-[#252936] shadow-sm">
                         <Clock className="w-[16px] h-[16px] text-[#8B5CF6]" />
                      </div>
                      <span>{targetProfile.is_online ? 'Currently online' : formatLastSeen(targetProfile.last_seen)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[14px] md:text-[15px] text-[#777283] dark:text-[#9A9FAD] italic">No recent activity.</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}