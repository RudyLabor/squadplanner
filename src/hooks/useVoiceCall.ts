import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useNetworkQualityStore } from './useNetworkQuality'
import type { CallUser, VoiceCallState } from './useCallState'
// LIVEKIT REMOVED: Using native WebRTC  
import { RING_TIMEOUT } from './useCallState'
// import { LIVEKIT_URL } from './useCallState'
// import { initializeLiveKitRoom, subscribeToIncomingCalls as _subscribeToIncomingCalls, sendCallPushNotification } from './useCallActions'
import { sendCallPushNotification, initializeNativeWebRTC } from './useCallActions'

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
    const { durationInterval, ringTimeout, room } = get()
    if (durationInterval) clearInterval(durationInterval)
    if (ringTimeout) clearTimeout(ringTimeout)
    useNetworkQualityStore.getState().resetQuality()

    if (room) {
      room.remoteParticipants.forEach((participant: { identity: string }) => {
        const audioEl = document.getElementById(`call-audio-${participant.identity}`)
        if (audioEl) audioEl.remove()
      })
      room.disconnect().catch(() => {})
    }

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
    // Native WebRTC - no URL configuration needed
    console.log('[VoiceCall] Using native WebRTC')

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

      const ringTimeout = setTimeout(() => {
        const currentState = get()
        if (currentState.status === 'calling') {
          get().endCall()
        }
      }, RING_TIMEOUT)

      set({ ringTimeout })

      // Native WebRTC implementation
      await initializeNativeWebRTC(user.id, receiver.id, useVoiceCallStore)
      console.log('[useVoiceCall] Native WebRTC call initialized')
    } catch (error) {
      console.warn('Error starting call:', error)
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

      // LIVEKIT REMOVED: Replace with native WebRTC implementation  
      // await initializeLiveKitRoom(user.id, state.caller.id, useVoiceCallStore)
      console.log('[useVoiceCall] Native WebRTC answer call setup needed')

      const callStartTime = Date.now()
      const durationInterval = setInterval(() => {
        set((s) => ({
          callDuration: Math.floor((Date.now() - (s.callStartTime || Date.now())) / 1000),
        }))
      }, 1000)

      set({ status: 'connected', callStartTime, durationInterval })
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
    const { room, durationInterval, ringTimeout, currentCallId, callStartTime, status } = state

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

    try {
      if (room) {
        room.remoteParticipants.forEach((participant: { identity: string }) => {
          const audioEl = document.getElementById(`call-audio-${participant.identity}`)
          if (audioEl) audioEl.remove()
        })
        await room.disconnect()
      }
    } catch (error) {
      console.warn('Error cleaning up LiveKit:', error)
    }

    set({ status: 'ended' })
    setTimeout(() => get().resetCall(), 2000)
  },

  toggleMute: async () => {
    const { room, isMuted } = get()
    if (room) {
      await room.localParticipant.setMicrophoneEnabled(isMuted)
      set({ isMuted: !isMuted })
    }
  },

  toggleSpeaker: () => {
    set((state) => ({ isSpeakerOn: !state.isSpeakerOn }))
  },
}))

export function subscribeToIncomingCalls(userId: string) {
  return _subscribeToIncomingCalls(userId, useVoiceCallStore)
}
