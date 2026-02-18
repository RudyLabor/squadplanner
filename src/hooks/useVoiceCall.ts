import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useNetworkQualityStore } from './useNetworkQuality'
import type { CallUser, VoiceCallState } from './useCallState'
import { RING_TIMEOUT } from './useCallState'
import { sendCallPushNotification, initializeNativeWebRTC, disconnectWebRTC, toggleWebRTCMute, subscribeToIncomingCalls as _subscribeToIncomingCalls } from './useCallActions'

export type { CallStatus, CallUser } from './useCallState'
export { formatCallDuration } from './useCallState'

export const useVoiceCallStore = create<VoiceCallState>((set, get) => ({
  status: 'idle',
  isMuted: false,
  isSpeakerOn: true,
  callStartTime: null,
  callDuration: 0,
  error: null,
  isReconnecting: false,
  reconnectAttempts: 0,
  networkQualityChanged: null,
  caller: null,
  receiver: null,
  isIncoming: false,
  currentCallId: null,
  room: null,
  durationInterval: null,
  ringTimeout: null,

  clearError: () => set({ error: null }),

  clearNetworkQualityNotification: () => set({ networkQualityChanged: null }),

  resetCall: () => {
    const { durationInterval, ringTimeout } = get()
    if (durationInterval) clearInterval(durationInterval)
    if (ringTimeout) clearTimeout(ringTimeout)
    disconnectWebRTC()
    useNetworkQualityStore.getState().resetQuality()

    set({
      status: 'idle',
      isMuted: false,
      isSpeakerOn: true,
      callStartTime: null,
      callDuration: 0,
      error: null,
      isReconnecting: false,
      reconnectAttempts: 0,
      networkQualityChanged: null,
      caller: null,
      receiver: null,
      isIncoming: false,
      currentCallId: null,
      room: null,
      durationInterval: null,
      ringTimeout: null,
    })
  },

  startCall: async (
    receiverId: string,
    receiverUsername: string,
    receiverAvatar?: string | null
  ) => {
    if (!import.meta.env.PROD) {
      console.log('[VoiceCall] startCall called:', { receiverId, receiverUsername, receiverAvatar })
    }
    const state = get()
    if (state.status !== 'idle') {
      if (!import.meta.env.PROD) {
        console.warn('[VoiceCall] Already in a call, status:', state.status)
      }
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        set({ error: 'Utilisateur non connecte' })
        return
      }

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

      const { data: callRecord, error: dbError } = await supabase
        .from('calls')
        .insert({ caller_id: user.id, receiver_id: receiverId, status: 'missed' })
        .select()
        .single()

      if (dbError) console.warn('Error creating call record:', dbError)

      if (callRecord?.id) {
        await sendCallPushNotification(receiverId, caller, callRecord.id)
      }

      set({
        status: 'calling',
        caller,
        receiver,
        isIncoming: false,
        currentCallId: callRecord?.id || null,
        error: null,
      })

      // Ring timeout: 30s to wait for the receiver to pick up.
      // Cleared automatically when the callee's SDP answer arrives (via onAnswerReceived)
      // or when WebRTC reaches 'connected' state.
      const ringTimeout = setTimeout(() => {
        const currentState = get()
        if (currentState.status === 'calling') {
          get().endCall()
        }
      }, RING_TIMEOUT)

      set({ ringTimeout })

      // isOffer = true → caller creates SDP offer
      await initializeNativeWebRTC(user.id, receiver.id, useVoiceCallStore, true)
      if (!import.meta.env.PROD) console.log('[useVoiceCall] Native WebRTC call initialized')
    } catch (error) {
      if (!import.meta.env.PROD) console.warn('Error starting call:', error)
      set({
        status: 'idle',
        error: error instanceof Error ? error.message : "Erreur lors du demarrage de l'appel",
      })
    }
  },

  setIncomingCall: (caller: CallUser, callId: string) => {
    const state = get()
    if (state.status !== 'idle') {
      console.warn('Already in a call, rejecting incoming')
      return
    }

    const ringTimeout = setTimeout(() => {
      const currentState = get()
      if (currentState.status === 'ringing') {
        set({ status: 'missed' })
        setTimeout(() => get().resetCall(), 2000)
      }
    }, RING_TIMEOUT)

    set({ status: 'ringing', caller, isIncoming: true, currentCallId: callId, ringTimeout })
  },

  acceptCall: async () => {
    const state = get()
    if (state.status !== 'ringing' || !state.caller) {
      console.warn('No incoming call to accept')
      return
    }

    const { ringTimeout } = state
    if (ringTimeout) clearTimeout(ringTimeout)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        set({ error: 'Utilisateur non connecte' })
        return
      }

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

      if (state.currentCallId) {
        await supabase.from('calls').update({ status: 'answered' }).eq('id', state.currentCallId)
      }

      // Set status to 'calling' so the WebRTC onConnectionStateChange callback
      // can properly transition to 'connected' (it checks status === 'calling')
      set({ status: 'calling', ringTimeout: null })

      // isOffer = false → callee creates SDP answer
      await initializeNativeWebRTC(user.id, state.caller.id, useVoiceCallStore, false)
      if (!import.meta.env.PROD) console.log('[useVoiceCall] Native WebRTC answer call connected')
    } catch (error) {
      console.warn('Error accepting call:', error)
      set({
        error: error instanceof Error ? error.message : "Erreur lors de l'acceptation de l'appel",
      })
    }
  },

  rejectCall: async () => {
    const state = get()
    if (state.status !== 'ringing') {
      console.warn('No incoming call to reject')
      return
    }

    const { ringTimeout, currentCallId } = state
    if (ringTimeout) clearTimeout(ringTimeout)

    if (currentCallId) {
      await supabase.from('calls').update({ status: 'rejected' }).eq('id', currentCallId)
    }

    set({ status: 'rejected' })
    setTimeout(() => get().resetCall(), 1000)
  },

  endCall: async () => {
    const state = get()
    const { durationInterval, ringTimeout, currentCallId, callStartTime, status } = state

    if (durationInterval) clearInterval(durationInterval)
    if (ringTimeout) clearTimeout(ringTimeout)

    let duration = 0
    if (callStartTime && status === 'connected') {
      duration = Math.floor((Date.now() - callStartTime) / 1000)
    }

    if (currentCallId) {
      const updateData: Record<string, unknown> = { ended_at: new Date().toISOString() }
      if (status === 'connected') updateData.duration_seconds = duration
      else if (status === 'calling') updateData.status = 'missed'
      await supabase.from('calls').update(updateData).eq('id', currentCallId)
    }

    // Clean up WebRTC connection + signaling channel
    disconnectWebRTC()

    set({ status: 'ended' })
    setTimeout(() => get().resetCall(), 2000)
  },

  toggleMute: async () => {
    const newMuted = toggleWebRTCMute()
    set({ isMuted: newMuted })
  },

  toggleSpeaker: () => {
    set((state) => ({ isSpeakerOn: !state.isSpeakerOn }))
  },
}))

export function subscribeToIncomingCalls(userId: string) {
  return _subscribeToIncomingCalls(userId, useVoiceCallStore)
}
