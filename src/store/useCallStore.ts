/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';

export type CallStatus = 
  | 'idle'
  | 'outgoing_ringing'
  | 'ringing'
  | 'accepted'
  | 'incoming_ringing'
  | 'accepting'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'failed'
  | 'rejected'
  | 'missed'
  | 'busy'
  | 'cancelled';

export interface CallSession {
  id: string;
  conversation_id: string;
  caller_id: string;
  receiver_id: string;
  type: 'audio' | 'video';
  status: CallStatus;
  offer?: any;
  answer?: any;
  caller_candidates?: any[];
  receiver_candidates?: any[];
  started_at?: string;
  answered_at?: string;
  ended_at?: string;
  ended_reason?: string;
  duration_seconds?: number;
}

interface CallStore {
  startCallFn: ((receiverId: string, conversationId: string, type: 'audio' | 'video') => Promise<void>) | null;
  setStartCallFn: (fn: any) => void;
  currentCall: CallSession | null;
  callStatus: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  
  setCurrentCall: (call: CallSession | null) => void;
  setCallStatus: (status: CallStatus) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setIsMuted: (isMuted: boolean) => void;
  setIsVideoOff: (isVideoOff: boolean) => void;
  reset: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  startCallFn: null,
  setStartCallFn: (fn: any) => set({ startCallFn: fn }),
  currentCall: null,
  callStatus: 'idle',
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,

  setCurrentCall: (call) => set({ currentCall: call }),
  setCallStatus: (status) => set({ callStatus: status }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setIsVideoOff: (isVideoOff) => set({ isVideoOff }),
  reset: () => set({
    currentCall: null,
    callStatus: 'idle',
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOff: false,
  }),
}));
