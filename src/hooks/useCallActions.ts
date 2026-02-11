import { supabase } from '../lib/supabase'
import { useNetworkQualityStore } from './useNetworkQuality'
import { generateChannelName, LIVEKIT_URL, MAX_RECONNECT_ATTEMPTS } from './useCallState'
import type { CallUser } from './useCallState'
import type { useVoiceCallStore as VoiceCallStoreType } from './useVoiceCall'

type VoiceCallStore = typeof VoiceCallStoreType

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
        body: `${caller.username} vous appelle`,
        icon: '/icon-192.svg',
        tag: `incoming-call-${callRecordId}`,
        data: {
          type: 'incoming_call',
          call_id: callRecordId,
          caller_id: caller.id,
          caller_name: caller.username,
          caller_avatar: caller.avatar_url
        },
        actions: [
          { action: 'answer', title: 'Repondre' },
          { action: 'decline', title: 'Refuser' }
        ]
      }
    })
  } catch (pushError) {
    if (!import.meta.env.PROD) console.warn('[VoiceCall] Push notification failed:', pushError)
  }
}

export async function initializeLiveKitRoom(
  currentUserId: string,
  otherUserId: string,
  storeRef: VoiceCallStore
) {
  const channelName = generateChannelName(currentUserId, otherUserId)

  try {
    const { data, error } = await supabase.functions.invoke('livekit-token', {
      body: {
        room_name: channelName,
        participant_identity: currentUserId,
        participant_name: currentUserId,
      },
    })

    if (error || !data?.token) {
      const serverError = data?.error ? ` (${data.error})` : ''
      throw new Error(`Impossible d'obtenir le token LiveKit${serverError}`)
    }

    const { Room, RoomEvent, Track, ConnectionQuality } = await import('livekit-client')

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      reconnectPolicy: {
        nextRetryDelayInMs: (context: { retryCount: number }) => {
          if (context.retryCount > MAX_RECONNECT_ATTEMPTS) return null
          return context.retryCount * 2000
        },
      },
    })

    room.on(RoomEvent.TrackSubscribed, (track: { kind: string; attach: () => HTMLMediaElement }, _publication: unknown, participant: { identity: string }) => {
      if (track.kind === Track.Kind.Audio) {
        const element = track.attach()
        element.id = `call-audio-${participant.identity}`
        document.body.appendChild(element)
        const currentState = storeRef.getState()
        if (currentState.status === 'calling') {
          const callStartTime = Date.now()
          const durationInterval = setInterval(() => {
            storeRef.setState(s => ({
              callDuration: Math.floor((Date.now() - (s.callStartTime || Date.now())) / 1000)
            }))
          }, 1000)
          storeRef.setState({ status: 'connected', callStartTime, durationInterval })
          if (currentState.ringTimeout) {
            clearTimeout(currentState.ringTimeout)
            storeRef.setState({ ringTimeout: null })
          }
        }
      }
    })

    room.on(RoomEvent.TrackUnsubscribed, (track: { detach: () => HTMLElement[] }) => {
      track.detach().forEach((el: HTMLElement) => el.remove())
    })

    room.on(RoomEvent.ParticipantDisconnected, () => {
      const currentState = storeRef.getState()
      if (currentState.status === 'connected' || currentState.status === 'calling') {
        currentState.endCall()
      }
    })

    room.on(RoomEvent.Reconnecting, () => {
      storeRef.setState({ isReconnecting: true })
    })

    room.on(RoomEvent.Reconnected, () => {
      storeRef.setState({ isReconnecting: false, reconnectAttempts: 0, error: null })
    })

    room.on(RoomEvent.Disconnected, (reason: string) => {
      const currentState = storeRef.getState()
      if (currentState.status === 'connected' && reason !== 'CLIENT_INITIATED') {
        storeRef.setState({
          isReconnecting: false,
          error: 'Impossible de se reconnecter. Verifiez votre connexion internet.'
        })
        currentState.endCall()
      }
    })

    room.on(RoomEvent.ConnectionQualityChanged, (quality: typeof ConnectionQuality[keyof typeof ConnectionQuality], participant: { sid: string }) => {
      if (participant.sid === room.localParticipant?.sid) {
        const newQuality = useNetworkQualityStore.getState().updateQuality(quality)
        if (newQuality) {
          storeRef.setState({ networkQualityChanged: newQuality })
        }
      }
    })

    await room.connect(LIVEKIT_URL, data.token)
    await room.localParticipant.setMicrophoneEnabled(true)
    storeRef.setState({ room })
  } catch (error) {
    console.warn('Error initializing LiveKit room:', error)
    storeRef.setState({
      error: error instanceof Error ? error.message : 'Erreur de connexion vocale',
    })
    throw error
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
            { id: call.caller_id, username: callerProfile.username, avatar_url: callerProfile.avatar_url },
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
          if (call.status === 'rejected' || call.status === 'ended' || call.ended_at) {
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

  return () => { supabase.removeChannel(channel) }
}
