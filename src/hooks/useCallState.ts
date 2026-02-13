import type { NetworkQualityLevel } from './useNetworkQuality'

export type CallStatus =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'connected'
  | 'ended'
  | 'missed'
  | 'rejected'

export interface CallUser {
  id: string
  username: string
  avatar_url?: string | null
}

export interface VoiceCallState {
  status: CallStatus
  isMuted: boolean
  isSpeakerOn: boolean
  callStartTime: number | null
  callDuration: number
  error: string | null
  isReconnecting: boolean
  reconnectAttempts: number
  networkQualityChanged: NetworkQualityLevel | null
  caller: CallUser | null
  receiver: CallUser | null
  isIncoming: boolean
  currentCallId: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  room: any | null
  durationInterval: ReturnType<typeof setInterval> | null
  ringTimeout: ReturnType<typeof setTimeout> | null

  startCall: (
    receiverId: string,
    receiverUsername: string,
    receiverAvatar?: string | null
  ) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleMute: () => Promise<void>
  toggleSpeaker: () => void
  setIncomingCall: (caller: CallUser, callId: string) => void
  clearError: () => void
  resetCall: () => void
  clearNetworkQualityNotification: () => void
}

// LIVEKIT REMOVED: Using native WebRTC
// export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || ''
export const RING_TIMEOUT = 30000
export const MAX_RECONNECT_ATTEMPTS = 3

export function generateChannelName(userId1: string, userId2: string): string {
  const hash1 = hashUserId(userId1)
  const hash2 = hashUserId(userId2)
  const sortedHashes = [hash1, hash2].sort()
  return `call_${sortedHashes.join('_')}`
}

function hashUserId(userId: string): string {
  return userId.replace(/-/g, '').substring(0, 8)
}

export function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
