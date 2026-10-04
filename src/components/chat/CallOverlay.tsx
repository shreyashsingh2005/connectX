/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useCallStore } from '@/store/useCallStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, SwitchCamera } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/useChatStore';

export function CallOverlay() {
  const { currentCall, callStatus, localStream, remoteStream, isMuted, isVideoOff, setIsMuted, setIsVideoOff } = useCallStore();
  const { acceptCall, endCall } = useWebRTC();
  const conversations = useChatStore(s => s.conversations);

  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus]);

  if (callStatus === 'idle' || !currentCall) return null;

  const conv = conversations.find(c => c.id === currentCall.conversation_id);
  const otherMember = conv?.type === 'group' ? null : conv?.other_member;
  const avatarUrl = conv?.type === 'group' ? conv.avatar_url : otherMember?.avatar_url;
  const displayName = conv?.type === 'group' ? conv.name : otherMember?.display_name || 'User';

  const isVideo = currentCall.type === 'video';

  // 1. INCOMING CALL RINGING
  if (callStatus === 'incoming_ringing') {
    return (
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-bg-surface shadow-2xl rounded-[16px] border border-border-subtle border-border-subtle p-4 flex items-center gap-4 w-[90%] max-w-sm animate-fade-in">
        <UserAvatar src={avatarUrl || undefined} name={displayName || 'User'} size="md" className="animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-main truncate">{displayName}</p>
          <p className="text-[13px] text-text-muted">Incoming {isVideo ? 'video' : 'audio'} call...</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => endCall('rejected')} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors">
            <PhoneOff className="w-5 h-5" />
          </button>
          <button onClick={acceptCall} className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors animate-bounce">
            {isVideo ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }

  // 2. ACTIVE VIDEO CALL
  if (isVideo && ['outgoing_ringing', 'accepting', 'connecting', 'connected', 'reconnecting'].includes(callStatus)) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
        {/* Remote Video Background */}
        {remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            
            <div className="relative mb-6">
              <UserAvatar 
                src={avatarUrl || undefined} 
                name={displayName || 'User'} 
                size="2xl" 
                className={cn(
                  "w-24 h-24 md:w-32 md:h-32 rounded-full opacity-60 transition-all duration-500",
                  ['connecting', 'outgoing_ringing', 'accepting', 'reconnecting'].includes(callStatus) ? 'ring-2 ring-[#8B5CF6]/50 ring-offset-4 ring-offset-black animate-pulse' : ''
                )} 
              />
            </div>

            <h2 className="text-white text-[22px] font-bold">{displayName}</h2>
            <p className="text-text-muted mt-2 capitalize">{callStatus === 'connected' ? formatDuration(duration) : callStatus.replace('_', ' ') + '...'}</p>
          </div>
        )}

        {/* Local Video Picture-in-Picture */}
        {localStream && (
          <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 w-32 h-48 bg-gray-900 rounded-[12px] overflow-hidden shadow-2xl border-2 border-gray-800 z-10">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-md px-6 py-4 rounded-full border border-white/10 z-10">
          <button onClick={() => setIsMuted(!isMuted)} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", isMuted ? "bg-bg-surface/20 text-white" : "bg-gray-700 hover:bg-gray-600 text-white")}>
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button onClick={() => setIsVideoOff(!isVideoOff)} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", isVideoOff ? "bg-bg-surface/20 text-white" : "bg-gray-700 hover:bg-gray-600 text-white")}>
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
          <button onClick={() => endCall()} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg">
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  // 3. ACTIVE AUDIO CALL
  return (
    <div className="fixed inset-0 z-[200] bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center mb-12">
        
        <div className="relative mb-8 mt-4">
          <UserAvatar 
            src={avatarUrl || undefined} 
            name={displayName || 'User'} 
            size="2xl" 
            className={cn(
              "w-24 h-24 md:w-32 md:h-32 rounded-full transition-all duration-500",
              callStatus === 'connected' ? 'ring-2 ring-green-500/80 ring-offset-4 ring-offset-gray-900' :
              ['connecting', 'outgoing_ringing', 'accepting', 'reconnecting'].includes(callStatus) ? 'ring-2 ring-[#8B5CF6]/60 ring-offset-4 ring-offset-gray-900 animate-pulse' :
              ''
            )} 
          />
        </div>

        <h2 className="text-white text-[28px] font-bold mb-2">{displayName}</h2>
        <p className="text-text-muted capitalize">{callStatus === 'connected' ? formatDuration(duration) : callStatus.replace('_', ' ')}</p>
      </div>
      
      {/* Hidden audio tags */}
      {remoteStream && <audio ref={remoteVideoRef as any} autoPlay playsInline className="hidden" />}

      <div className="flex items-center gap-6">
        <button onClick={() => setIsMuted(!isMuted)} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-colors", isMuted ? "bg-bg-surface text-text-main" : "bg-gray-800 hover:bg-gray-700 text-white")}>
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button onClick={() => endCall()} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-xl">
          <PhoneOff className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
