/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useCallStore, CallSession } from '@/store/useCallStore';
import toast from 'react-hot-toast';

let cachedIceServers: any = null;

export function useWebRTC() {
  const setStartCallFn = useCallStore(s => s.setStartCallFn);
  const supabase = createClient();
  const profile = useAuthStore((s) => s.profile);
  
  useEffect(() => {
    if (!cachedIceServers) {
      fetch('/api/turn').then(r => r.json()).then(data => {
        if (data.iceServers) cachedIceServers = { iceServers: data.iceServers };
      }).catch(() => {});
    }
  }, []);

  const { 
    currentCall, setCurrentCall, 
    callStatus, setCallStatus,
    setLocalStream, setRemoteStream,
    isMuted, isVideoOff, reset
  } = useCallStore();

  const pcRef = useRef<RTCPeerConnection | null>(null);

  const setupPeerConnection = useCallback((callId: string, isCaller: boolean) => {
    if (pcRef.current) pcRef.current.close();
    
    const pc = new RTCPeerConnection(cachedIceServers || { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await supabase.rpc('append_call_ice_candidate', {
            p_call_id: callId,
            p_side: isCaller ? 'caller' : 'receiver',
            p_candidate: event.candidate.toJSON()
          });
        } catch (e) {
          console.error('ICE RPC error', e);
        }
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setCallStatus('connected');
      else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') endCall('failed');
    };

    return pc;
  }, [supabase, setCallStatus, setRemoteStream]);

  const endCall = useCallback(async (reason: string = 'ended') => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    useCallStore.getState().localStream?.getTracks().forEach(track => track.stop());
    const call = useCallStore.getState().currentCall;
    
    if (call && !['ended', 'failed', 'rejected', 'missed', 'cancelled'].includes(call.status)) {
      const isCaller = call.caller_id === profile?.id;
      const finalReason = call.status === 'outgoing_ringing' && isCaller ? 'cancelled' : 
                          call.status === 'incoming_ringing' && !isCaller ? 'rejected' : reason;
     await supabase.from('call_sessions').update({ status: finalReason, ended_at: new Date().toISOString(), ended_reason: finalReason }).eq('id', call.id);
      
      let durationStr = '';
      if (call.answered_at && (finalReason === 'ended' || finalReason === 'failed' || reason === 'ended' || reason === 'failed')) {
        const seconds = Math.floor((Date.now() - new Date(call.answered_at).getTime()) / 1000);
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        durationStr = '|' + m + ':' + s;
      }
      
      let callSystemType = call.type;
      if (['rejected', 'missed', 'cancelled'].includes(finalReason)) {
        callSystemType = 'missed_' + call.type;
      }
      
      await supabase.from('messages').insert({
        conversation_id: call.conversation_id,
        sender_id: profile?.id || '',
        type: 'system',
        content: 'CALL_HISTORY|' + callSystemType + durationStr,
        status: 'sent'
      });
    }
    reset();
  }, [profile, supabase, reset]);

  const startCall = useCallback(async (receiverId: string, conversationId: string, type: 'audio' | 'video') => {
    if (!profile) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      setLocalStream(stream);

      const { data: call, error } = await supabase.from('call_sessions').insert({
        conversation_id: conversationId,
        caller_id: profile.id,
        receiver_id: receiverId,
        type,
        status: 'ringing'
      }).select().single();

      if (error || !call) throw error || new Error('Failed to create call');

      setCurrentCall(call);
      setCallStatus('outgoing_ringing');

      const pc = setupPeerConnection(call.id, true);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await supabase.from('call_sessions').update({ offer }).eq('id', call.id);
    } catch (err: any) {
      toast.error(err.name === 'NotAllowedError' ? 'Microphone/Camera access denied' : 'Failed to start call');
      reset();
    }
  }, [profile, supabase, setupPeerConnection, setCurrentCall, setCallStatus, setLocalStream, reset]);

  const acceptCall = useCallback(async () => {
    const call = useCallStore.getState().currentCall;
    if (!call || !profile) return;
    setCallStatus('accepting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.type === 'video' });
      setLocalStream(stream);

      const pc = setupPeerConnection(call.id, false);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      if (call.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
        if (call.caller_candidates && call.caller_candidates.length > 0) {
          for (const c of call.caller_candidates) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
          }
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await supabase.from('call_sessions').update({ status: 'accepted', answer, answered_at: new Date().toISOString() }).eq('id', call.id);
      setCallStatus('connecting');
    } catch (err: any) {
      toast.error(err.name === 'NotAllowedError' ? 'Microphone/Camera access denied' : 'Failed to accept call');
      endCall('failed');
    }
  }, [profile, setupPeerConnection, setCallStatus, setLocalStream, supabase, endCall]);

  // Listener for signaling
  useEffect(() => {
    if (!profile) return;

    const channel = supabase.channel(`calls:${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions', filter: `receiver_id=eq.${profile.id}` }, handlePayload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions', filter: `caller_id=eq.${profile.id}` }, handlePayload)
      .subscribe();

    return () => { supabase.removeChannel(channel); };

    async function handlePayload(payload: any) {
      const newCall = payload.new as CallSession;
      if (payload.eventType === 'DELETE') return;

      const currentId = useCallStore.getState().currentCall?.id;
      const status = useCallStore.getState().callStatus;
      const isCaller = newCall.caller_id === profile?.id;

      if (!currentId) {
        if (newCall.status === 'ringing' && !isCaller) {
          setCurrentCall(newCall);
          setCallStatus('incoming_ringing');
        }
     } else if (currentId !== newCall.id && newCall.status === 'ringing' && !isCaller) {
        await supabase.from('call_sessions').update({ status: 'busy', ended_at: new Date().toISOString(), ended_reason: 'busy' }).eq('id', newCall.id);
        await supabase.from('messages').insert({
          conversation_id: newCall.conversation_id,
          sender_id: profile?.id || '',
          type: 'system',
          content: 'CALL_HISTORY|missed_' + newCall.type,
          status: 'sent'
        });
      } else if (currentId === newCall.id) {
        setCurrentCall(newCall);
        const pc = pcRef.current;

        if (['rejected', 'missed', 'cancelled', 'ended', 'failed', 'busy'].includes(newCall.status)) {
          if (status !== 'idle') endCall(newCall.status);
          return;
        }

        if (pc) {
          if (newCall.status === 'accepted' && isCaller && !pc.remoteDescription && newCall.answer) {
            setCallStatus('connecting');
            try { await pc.setRemoteDescription(new RTCSessionDescription(newCall.answer)); } catch(e) {}
          }

          // Process ICE candidates
          const remoteCandidates = isCaller ? newCall.receiver_candidates : newCall.caller_candidates;
          if (remoteCandidates && remoteCandidates.length > 0 && pc.remoteDescription) {
            for (const c of remoteCandidates) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch(e) {}
            }
          }
        }
      }
    }
  }, [profile, supabase, setCurrentCall, setCallStatus, endCall]);

  useEffect(() => {
    const stream = useCallStore.getState().localStream;
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = !isMuted);
      stream.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
    }
  }, [isMuted, isVideoOff]);

     useEffect(() => {
    setStartCallFn(startCall);
  }, [startCall, setStartCallFn]);

  return { startCall, acceptCall, endCall };
}
