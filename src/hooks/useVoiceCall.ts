import { create } from 'zustand'
import AgoraRTC from 'agora-rtc-sdk-ng'
import type {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng'
import { supabase } from '../lib/supabase'

// Types
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected'

export interface CallUser {
  id: string
  username: string
  avatar_url?: string | null
}

interface VoiceCallState {
  // State
  status: CallStatus
  isMuted: boolean
  isSpeakerOn: boolean
  callStartTime: number | null
  callDuration: number
  error: string | null

  // Call participants
  caller: CallUser | null
  receiver: CallUser | null
  isIncoming: boolean
  currentCallId: string | null

  // Internal refs (not reactive)
  client: IAgoraRTCClient | null
  localAudioTrack: IMicrophoneAudioTrack | null
  durationInterval: ReturnType<typeof setInterval> | null
  ringTimeout: ReturnType<typeof setTimeout> | null

  // Actions
  startCall: (receiverId: string, receiverUsername: string, receiverAvatar?: string | null) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleMute: () => Promise<void>
  toggleSpeaker: () => void
  setIncomingCall: (caller: CallUser, callId: string) => void
  clearError: () => void
  resetCall: () => void
}

// Agora App ID
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || ''

// Generate channel name from two user IDs (sorted for consistency)
function generateChannelName(userId1: string, userId2: string): string {
  const sortedIds = [userId1, userId2].sort()
  return `call_${sortedIds.join('_')}`
}

// Ringtone timeout (30 seconds)
const RING_TIMEOUT = 30000

export const useVoiceCallStore = create<VoiceCallState>((set, get) => ({
  // Initial state
  status: 'idle',
  isMuted: false,
  isSpeakerOn: true,
  callStartTime: null,
  callDuration: 0,
  error: null,
  caller: null,
  receiver: null,
  isIncoming: false,
  currentCallId: null,
  client: null,
  localAudioTrack: null,
  durationInterval: null,
  ringTimeout: null,

  clearError: () => set({ error: null }),

  resetCall: () => {
    const { durationInterval, ringTimeout, client, localAudioTrack } = get()

    // Clear intervals and timeouts
    if (durationInterval) clearInterval(durationInterval)
    if (ringTimeout) clearTimeout(ringTimeout)

    // Cleanup Agora
    if (localAudioTrack) {
      localAudioTrack.stop()
      localAudioTrack.close()
    }
    if (client) {
      client.leave().catch(console.error)
    }

    set({
      status: 'idle',
      isMuted: false,
      isSpeakerOn: true,
      callStartTime: null,
      callDuration: 0,
      error: null,
      caller: null,
      receiver: null,
      isIncoming: false,
      currentCallId: null,
      client: null,
      localAudioTrack: null,
      durationInterval: null,
      ringTimeout: null,
    })
  },

  // Start an outgoing call
  startCall: async (receiverId: string, receiverUsername: string, receiverAvatar?: string | null) => {
    const state = get()

    if (state.status !== 'idle') {
      console.warn('Already in a call')
      return
    }

    if (!AGORA_APP_ID) {
      set({ error: 'Agora App ID non configure. Contactez l\'administrateur.' })
      return
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ error: 'Utilisateur non connecte' })
        return
      }

      // Get caller profile
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()

      const caller: CallUser = {
        id: user.id,
        username: callerProfile?.username || 'Utilisateur',
        avatar_url: callerProfile?.avatar_url,
      }

      const receiver: CallUser = {
        id: receiverId,
        username: receiverUsername,
        avatar_url: receiverAvatar,
      }

      // Create call record in database
      const { data: callRecord, error: dbError } = await supabase
        .from('calls')
        .insert({
          caller_id: user.id,
          receiver_id: receiverId,
          status: 'missed', // Default to missed, will update when answered
        })
        .select()
        .single()

      if (dbError) {
        console.error('Error creating call record:', dbError)
      }

      set({
        status: 'calling',
        caller,
        receiver,
        isIncoming: false,
        currentCallId: callRecord?.id || null,
        error: null,
      })

      // Setup ring timeout
      const ringTimeout = setTimeout(() => {
        const currentState = get()
        if (currentState.status === 'calling') {
          // Mark as missed and end
          get().endCall()
        }
      }, RING_TIMEOUT)

      set({ ringTimeout })

      // Initialize Agora client and wait for the other user
      await initializeAgoraClient(user.id, receiver.id)

    } catch (error) {
      console.error('Error starting call:', error)
      set({
        status: 'idle',
        error: error instanceof Error ? error.message : 'Erreur lors du demarrage de l\'appel',
      })
    }
  },

  // Set incoming call (called when receiving a call signal)
  setIncomingCall: (caller: CallUser, callId: string) => {
    const state = get()

    if (state.status !== 'idle') {
      console.warn('Already in a call, rejecting incoming')
      return
    }

    // Setup ring timeout
    const ringTimeout = setTimeout(() => {
      const currentState = get()
      if (currentState.status === 'ringing') {
        set({ status: 'missed' })
        // Reset after a moment
        setTimeout(() => get().resetCall(), 2000)
      }
    }, RING_TIMEOUT)

    set({
      status: 'ringing',
      caller,
      isIncoming: true,
      currentCallId: callId,
      ringTimeout,
    })
  },

  // Accept incoming call
  acceptCall: async () => {
    const state = get()

    if (state.status !== 'ringing' || !state.caller) {
      console.warn('No incoming call to accept')
      return
    }

    const { ringTimeout } = state
    if (ringTimeout) clearTimeout(ringTimeout)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ error: 'Utilisateur non connecte' })
        return
      }

      // Get receiver (current user) profile
      const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()

      const receiver: CallUser = {
        id: user.id,
        username: receiverProfile?.username || 'Utilisateur',
        avatar_url: receiverProfile?.avatar_url,
      }

      set({ receiver, ringTimeout: null })

      // Update call status in database
      if (state.currentCallId) {
        await supabase
          .from('calls')
          .update({ status: 'answered' })
          .eq('id', state.currentCallId)
      }

      // Initialize Agora and connect
      await initializeAgoraClient(user.id, state.caller.id)

      // Mark as connected
      const callStartTime = Date.now()

      // Start duration counter
      const durationInterval = setInterval(() => {
        set(s => ({
          callDuration: Math.floor((Date.now() - (s.callStartTime || Date.now())) / 1000)
        }))
      }, 1000)

      set({
        status: 'connected',
        callStartTime,
        durationInterval,
      })

    } catch (error) {
      console.error('Error accepting call:', error)
      set({
        error: error instanceof Error ? error.message : 'Erreur lors de l\'acceptation de l\'appel',
      })
    }
  },

  // Reject incoming call
  rejectCall: async () => {
    const state = get()

    if (state.status !== 'ringing') {
      console.warn('No incoming call to reject')
      return
    }

    const { ringTimeout, currentCallId } = state
    if (ringTimeout) clearTimeout(ringTimeout)

    // Update call status in database
    if (currentCallId) {
      await supabase
        .from('calls')
        .update({ status: 'rejected' })
        .eq('id', currentCallId)
    }

    set({ status: 'rejected' })

    // Reset after a moment
    setTimeout(() => get().resetCall(), 1000)
  },

  // End current call
  endCall: async () => {
    const state = get()
    const { client, localAudioTrack, durationInterval, ringTimeout, currentCallId, callStartTime, status } = state

    // Clear intervals and timeouts
    if (durationInterval) clearInterval(durationInterval)
    if (ringTimeout) clearTimeout(ringTimeout)

    // Calculate duration if call was connected
    let duration = 0
    if (callStartTime && status === 'connected') {
      duration = Math.floor((Date.now() - callStartTime) / 1000)
    }

    // Update call record
    if (currentCallId) {
      const updateData: Record<string, unknown> = {
        ended_at: new Date().toISOString(),
      }

      if (status === 'connected') {
        updateData.duration_seconds = duration
      } else if (status === 'calling') {
        updateData.status = 'missed'
      }

      await supabase
        .from('calls')
        .update(updateData)
        .eq('id', currentCallId)
    }

    // Cleanup Agora
    try {
      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
      }
      if (client) {
        await client.leave()
      }
    } catch (error) {
      console.error('Error cleaning up Agora:', error)
    }

    set({ status: 'ended' })

    // Reset after a moment
    setTimeout(() => get().resetCall(), 2000)
  },

  // Toggle mute
  toggleMute: async () => {
    const { localAudioTrack, isMuted } = get()

    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted) // Toggle
      set({ isMuted: !isMuted })
    }
  },

  // Toggle speaker (for future implementation with speaker routing)
  toggleSpeaker: () => {
    set(state => ({ isSpeakerOn: !state.isSpeakerOn }))
  },
}))

// Helper function to initialize Agora client
async function initializeAgoraClient(currentUserId: string, otherUserId: string) {
  const channelName = generateChannelName(currentUserId, otherUserId)

  try {
    // Create client
    const client = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8',
    })

    // Set up event listeners
    client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      if (mediaType === 'audio') {
        await client.subscribe(user, mediaType)
        user.audioTrack?.play()

        // If we were calling, now we're connected
        const currentState = useVoiceCallStore.getState()
        if (currentState.status === 'calling') {
          const callStartTime = Date.now()

          // Start duration counter
          const durationInterval = setInterval(() => {
            useVoiceCallStore.setState(s => ({
              callDuration: Math.floor((Date.now() - (s.callStartTime || Date.now())) / 1000)
            }))
          }, 1000)

          useVoiceCallStore.setState({
            status: 'connected',
            callStartTime,
            durationInterval,
          })

          // Clear ring timeout
          if (currentState.ringTimeout) {
            clearTimeout(currentState.ringTimeout)
            useVoiceCallStore.setState({ ringTimeout: null })
          }
        }
      }
    })

    client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      if (mediaType === 'audio') {
        user.audioTrack?.stop()
      }
    })

    client.on('user-left', () => {
      // Other user left, end the call
      const currentState = useVoiceCallStore.getState()
      if (currentState.status === 'connected' || currentState.status === 'calling') {
        currentState.endCall()
      }
    })

    // Get token from Edge Function
    let token: string | null = null

    try {
      const { data } = await supabase.functions.invoke('agora-token', {
        body: { channel_name: channelName, uid: currentUserId },
      })
      token = data?.token || null
    } catch {
      console.warn('Token generation failed, joining without token')
    }

    // Join channel
    await client.join(AGORA_APP_ID, channelName, token, currentUserId)

    // Create and publish audio track
    const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack()
    await client.publish([localAudioTrack])

    useVoiceCallStore.setState({
      client,
      localAudioTrack,
    })

    console.log('Joined voice call channel:', channelName)

  } catch (error) {
    console.error('Error initializing Agora client:', error)
    useVoiceCallStore.setState({
      error: error instanceof Error ? error.message : 'Erreur de connexion vocale',
    })
    throw error
  }
}

// Subscribe to incoming calls via Supabase Realtime
export function subscribeToIncomingCalls(userId: string) {
  const channel = supabase
    .channel(`calls:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'calls',
        filter: `receiver_id=eq.${userId}`,
      },
      async (payload) => {
        const call = payload.new as {
          id: string
          caller_id: string
          status: string
        }

        // Only handle new calls (missed status means not yet answered)
        if (call.status !== 'missed') return

        const currentState = useVoiceCallStore.getState()
        if (currentState.status !== 'idle') {
          // Already in a call, reject
          await supabase
            .from('calls')
            .update({ status: 'rejected' })
            .eq('id', call.id)
          return
        }

        // Get caller info
        const { data: callerProfile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', call.caller_id)
          .single()

        if (callerProfile) {
          currentState.setIncomingCall(
            {
              id: call.caller_id,
              username: callerProfile.username,
              avatar_url: callerProfile.avatar_url,
            },
            call.id
          )
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Format duration for display
export function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
