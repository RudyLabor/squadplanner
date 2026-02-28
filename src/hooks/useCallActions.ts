import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useNetworkQualityStore } from './useNetworkQuality'
import { generateChannelName, MAX_RECONNECT_ATTEMPTS } from './useCallState'
import { NativeWebRTC } from '../lib/webrtc-native'
import type { CallUser } from './useCallState'
import type { useVoiceCallStore as VoiceCallStoreType } from './useVoiceCall'

type VoiceCallStore = typeof VoiceCallStoreType

// Singleton WebRTC instance for current call
let _activeWebRTC: NativeWebRTC | null = null

export async function sendCallPushNotification(
  receiverId: string,
  caller: CallUser,
  callRecordId: string
) {
  try {
    await supabase.functions.invoke('send-push', {
      body: {
        userId: receiverId,
        title: 'Appel entrant',
        body: `${caller.username} t'appelle`,
        icon: '/icon-192.svg',
        tag: `incoming-call-${callRecordId}`,
        data: {
          type: 'incoming_call',
          call_id: callRecordId,
          caller_id: caller.id,
          caller_name: caller.username,
          caller_avatar: caller.avatar_url,
        },
        actions: [
          { action: 'answer', title: 'Répondre' },
          { action: 'decline', title: 'Refuser' },
        ],
      },
    })
  } catch (pushError) {
    if (!import.meta.env.PROD) console.warn('[VoiceCall] Push notification failed:', pushError)
  }
}

/**
 * Initialize a native WebRTC peer connection with Supabase Realtime signaling.
 * @param isOffer true for the caller (creates SDP offer), false for the callee (creates SDP answer)
 */
export async function initializeNativeWebRTC(
  currentUserId: string,
  otherUserId: string,
  storeRef: VoiceCallStore,
  isOffer: boolean
) {
  const channelName = generateChannelName(currentUserId, otherUserId)

  try {
    // Clean up any previous connection
    if (_activeWebRTC) {
      _activeWebRTC.disconnect()
      _activeWebRTC = null
    }

    const webrtc = new NativeWebRTC({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })

    // Wire up connection state changes
    webrtc.onConnectionStateChange = (state) => {
      if (state === 'connected') {
        const currentState = storeRef.getState()
        if (currentState.status === 'calling') {
          const callStartTime = Date.now()
          const durationInterval = setInterval(() => {
            storeRef.setState((s) => ({
              callDuration: Math.floor((Date.now() - (s.callStartTime || Date.now())) / 1000),
            }))
          }, 1000)
          storeRef.setState({ status: 'connected', callStartTime, durationInterval })
          // Clear ring timeout — call is now connected
          if (currentState.ringTimeout) {
            clearTimeout(currentState.ringTimeout)
            storeRef.setState({ ringTimeout: null })
          }
        }
      } else if (state === 'disconnected' || state === 'failed') {
        const currentState = storeRef.getState()
        if (currentState.status === 'connected') {
          storeRef.setState({ isReconnecting: true })
        }
        if (state === 'failed') {
          storeRef.setState({
            isReconnecting: false,
            error: 'Connexion perdue. Vérifie ta connexion internet.',
          })
          currentState.endCall()
        }
      }
    }

    // When the caller receives the callee's SDP answer, clear the ring timeout
    // because the callee has accepted and the connection is in progress
    webrtc.onAnswerReceived = () => {
      const currentState = storeRef.getState()
      if (currentState.ringTimeout) {
        clearTimeout(currentState.ringTimeout)
        storeRef.setState({ ringTimeout: null })
      }
    }

    // Connect via Supabase Realtime signaling (no livekit-token needed)
    const connected = await webrtc.connect(supabase, channelName, isOffer)
    if (!connected) {
      throw new Error('Échec de la connexion WebRTC')
    }

    _activeWebRTC = webrtc
  } catch (error) {
    if (!import.meta.env.PROD) console.warn('[useCallActions] WebRTC error:', error)
    _activeWebRTC?.disconnect()
    _activeWebRTC = null
    storeRef.setState({
      error: error instanceof Error ? error.message : 'Erreur de connexion vocale',
    })
    throw error
  }
}

/** Toggle mute on the active WebRTC call */
export function toggleWebRTCMute(): boolean {
  if (_activeWebRTC) {
    return _activeWebRTC.toggleMute()
  }
  return false
}

/** Disconnect active WebRTC call */
export function disconnectWebRTC() {
  if (_activeWebRTC) {
    _activeWebRTC.disconnect()
    _activeWebRTC = null
  }
}

export function subscribeToIncomingCalls(userId: string, storeRef: VoiceCallStore) {
  const channel = supabase
    .channel(`calls:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'calls', filter: `receiver_id=eq.${userId}` },
      async (payload) => {
        const call = payload.new as { id: string; caller_id: string; status: string }
        if (call.status !== 'missed') return

        const currentState = storeRef.getState()
        if (currentState.status !== 'idle') {
          await supabase.from('calls').update({ status: 'rejected' }).eq('id', call.id)
          return
        }

        const { data: callerProfile, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', call.caller_id)
          .single()

        if (profileError) {
          console.warn('[VoiceCall] Error fetching caller profile:', profileError)
          return
        }

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
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'calls', filter: `receiver_id=eq.${userId}` },
      (payload) => {
        const call = payload.new as { id: string; status: string; ended_at: string | null }
        const currentState = storeRef.getState()
        if (currentState.currentCallId === call.id) {
          if (
            call.status === 'rejected' ||
            call.status === 'ended' ||
            call.status === 'missed' ||
            call.ended_at
          ) {
            currentState.resetCall()
          }
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'calls', filter: `caller_id=eq.${userId}` },
      (payload) => {
        const call = payload.new as { id: string; status: string; ended_at: string | null }
        const currentState = storeRef.getState()
        if (currentState.currentCallId === call.id) {
          if (call.status === 'rejected') {
            currentState.resetCall()
          } else if (call.ended_at && currentState.status !== 'idle') {
            currentState.resetCall()
          }
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
