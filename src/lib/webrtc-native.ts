// Native WebRTC with Supabase Realtime signaling
// Replaces LiveKit SDK — saves ~450KB bundle size

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'

interface WebRTCConfig {
  iceServers: RTCIceServer[]
}

interface VoiceUser {
  id: string
  username: string
  isMuted: boolean
  isSpeaking: boolean
  volume: number
}

export class NativeWebRTC {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private isConnected = false
  private isMuted = false
  private config: WebRTCConfig
  private signalingChannel: RealtimeChannel | null = null
  private supabaseClient: SupabaseClient | null = null
  private offerInterval: ReturnType<typeof setInterval> | null = null
  private pendingCandidates: RTCIceCandidateInit[] = []
  private _aborted = false

  // Events
  onConnectionStateChange?: (state: string) => void
  onRemoteUser?: (user: VoiceUser) => void
  onUserLeft?: (userId: string) => void
  onSpeaking?: (userId: string, isSpeaking: boolean) => void
  /** Fires when the remote peer's SDP answer arrives (caller side only) */
  onAnswerReceived?: () => void

  constructor(config: WebRTCConfig) {
    this.config = config
  }

  /**
   * Connect to peer via Supabase Realtime signaling.
   * @param supabase  Supabase client for the signaling channel
   * @param channelName  Deterministic channel name shared by both peers
   * @param isOffer  true = caller (creates SDP offer), false = callee (creates SDP answer)
   */
  async connect(supabase: SupabaseClient, channelName: string, isOffer: boolean): Promise<boolean> {
    try {
      this._aborted = false
      this.supabaseClient = supabase

      this.peerConnection = new RTCPeerConnection({
        iceServers: this.config.iceServers,
      })

      // ICE connection state → surface to call store
      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState || 'disconnected'
        this.isConnected = state === 'connected' || state === 'completed'
        this.onConnectionStateChange?.(state === 'completed' ? 'connected' : state)
      }

      // Remote audio track
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0]
        const audio = new Audio()
        audio.srcObject = this.remoteStream
        audio.autoplay = true
        audio.play().catch(() => {})
      }

      // ICE candidates → broadcast to peer
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.signalingChannel) {
          this.signalingChannel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'ice-candidate', candidate: event.candidate.toJSON() },
          })
        }
      }

      // Microphone (non-blocking — call still works if mic denied, just no outbound audio)
      await this.enableMicrophone()

      // SDP signaling via Supabase Realtime broadcast
      await this.setupSignaling(supabase, channelName, isOffer)

      return true
    } catch (error) {
      if (!import.meta.env.PROD) console.error('[NativeWebRTC] Connection failed:', error)
      this.disconnect()
      return false
    }
  }

  // ── Signaling via Supabase Realtime ────────────────────────────────────

  private setupSignaling(
    supabase: SupabaseClient,
    channelName: string,
    isOffer: boolean
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // 60-second signaling timeout (separate from the 30s ring timeout)
      const timeoutId = setTimeout(() => {
        if (!this._aborted) reject(new Error("Signaling timeout — le pair n'a pas répondu"))
      }, 60_000)

      const cleanup = () => {
        clearTimeout(timeoutId)
        if (this.offerInterval) {
          clearInterval(this.offerInterval)
          this.offerInterval = null
        }
      }

      this.signalingChannel = supabase.channel(`signal:${channelName}`, {
        config: { broadcast: { self: false } },
      })

      this.signalingChannel
        .on('broadcast', { event: 'signal' }, async ({ payload }) => {
          try {
            if (!this.peerConnection || this._aborted) return

            // ── Callee receives offer ──
            if (payload.type === 'offer' && !isOffer) {
              await this.peerConnection.setRemoteDescription(
                new RTCSessionDescription({ type: 'offer', sdp: payload.sdp })
              )
              // Flush any ICE candidates queued before remoteDescription was set
              for (const c of this.pendingCandidates) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(c))
              }
              this.pendingCandidates = []

              const answer = await this.peerConnection.createAnswer()
              await this.peerConnection.setLocalDescription(answer)
              this.signalingChannel!.send({
                type: 'broadcast',
                event: 'signal',
                payload: { type: 'answer', sdp: answer.sdp },
              })
              cleanup()
              resolve()
            }

            // ── Caller receives answer ──
            if (payload.type === 'answer' && isOffer) {
              if (this.offerInterval) {
                clearInterval(this.offerInterval)
                this.offerInterval = null
              }
              await this.peerConnection.setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp: payload.sdp })
              )
              for (const c of this.pendingCandidates) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(c))
              }
              this.pendingCandidates = []
              this.onAnswerReceived?.()
              cleanup()
              resolve()
            }

            // ── ICE candidate exchange ──
            if (payload.type === 'ice-candidate' && payload.candidate) {
              if (this.peerConnection.remoteDescription) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate))
              } else {
                this.pendingCandidates.push(payload.candidate)
              }
            }
          } catch (err) {
            if (!import.meta.env.PROD) console.warn('[NativeWebRTC] Signaling error:', err)
          }
        })
        .subscribe(async (status) => {
          if (this._aborted) {
            cleanup()
            reject(new Error('Aborted'))
            return
          }

          if (status === 'SUBSCRIBED' && isOffer) {
            // Caller: create SDP offer and broadcast periodically until answer arrives
            try {
              const offer = await this.peerConnection!.createOffer()
              await this.peerConnection!.setLocalDescription(offer)

              const sendOffer = () => {
                this.signalingChannel?.send({
                  type: 'broadcast',
                  event: 'signal',
                  payload: { type: 'offer', sdp: offer.sdp },
                })
              }
              sendOffer()
              // Re-send every 2s in case callee hasn't subscribed yet
              this.offerInterval = setInterval(sendOffer, 2000)
            } catch (err) {
              cleanup()
              reject(err)
            }
          }
          // Callee: nothing to do on SUBSCRIBED — just wait for the offer
        })
    })
  }

  /**
   * Local-only connection: enables microphone + VAD without peer signaling.
   * Used by voice party (group presence) where actual audio routing is handled separately.
   */
  async connectLocalOnly(): Promise<boolean> {
    try {
      this._aborted = false
      this.peerConnection = new RTCPeerConnection({ iceServers: this.config.iceServers })

      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState || 'disconnected'
        this.isConnected = state === 'connected' || state === 'completed'
        this.onConnectionStateChange?.(state === 'completed' ? 'connected' : state)
      }

      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0]
        const audio = new Audio()
        audio.srcObject = this.remoteStream
        audio.autoplay = true
        audio.play().catch(() => {})
      }

      const micSuccess = await this.enableMicrophone()
      if (!micSuccess) {
        console.error('[NativeWebRTC] Microphone required for party — access denied or unavailable')
        this.disconnect()
        return false
      }
      return true
    } catch (error) {
      if (!import.meta.env.PROD) console.error('[NativeWebRTC] Local connect failed:', error)
      this.disconnect()
      return false
    }
  }

  // ── Microphone ─────────────────────────────────────────────────────────

  async enableMicrophone(): Promise<boolean> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream)
        }
      })
      this.setupVoiceActivityDetection()
      return true
    } catch (error) {
      if (!import.meta.env.PROD) console.error('[NativeWebRTC] Microphone access failed:', error)
      return false
    }
  }

  toggleMute(): boolean {
    if (!this.localStream) return this.isMuted
    const audioTrack = this.localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      this.isMuted = !audioTrack.enabled
    }
    return this.isMuted
  }

  setVolume(_volume: number): void {
    // Future: Web Audio API gain node
  }

  // ── Cleanup ────────────────────────────────────────────────────────────

  disconnect(): void {
    this._aborted = true

    if (this.offerInterval) {
      clearInterval(this.offerInterval)
      this.offerInterval = null
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.signalingChannel && this.supabaseClient) {
      this.supabaseClient.removeChannel(this.signalingChannel)
      this.signalingChannel = null
    }

    this.pendingCandidates = []
    this.isConnected = false
    this.isMuted = false
  }

  // ── Voice Activity Detection ───────────────────────────────────────────

  private setupVoiceActivityDetection(): void {
    if (!this.localStream) return
    try {
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(this.localStream)
      analyser.fftSize = 512
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      microphone.connect(analyser)

      const checkAudioLevel = () => {
        if (!this.peerConnection || this._aborted) return
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i]
        const rms = Math.sqrt(sum / bufferLength)
        this.onSpeaking?.('local', rms > 10)
        if (this.isConnected) requestAnimationFrame(checkAudioLevel)
      }
      checkAudioLevel()
    } catch (error) {
      if (!import.meta.env.PROD) console.warn('[NativeWebRTC] VAD setup failed:', error)
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected
  }
  get muted(): boolean {
    return this.isMuted
  }
}

// ── React Hook (used by voice chat / party — separate from 1-on-1 calls) ──

import { useState, useCallback, useEffect } from 'react'
import { supabaseMinimal as supabase } from './supabaseMinimal'

export function useNativeWebRTC() {
  const [webrtc] = useState(
    () =>
      new NativeWebRTC({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      })
  )

  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<VoiceUser[]>([])

  const connect = useCallback(
    async (channelName: string, isOffer: boolean) => {
      const success = await webrtc.connect(supabase, channelName, isOffer)
      setIsConnected(success)
      return success
    },
    [webrtc]
  )

  const connectLocalOnly = useCallback(async () => {
    const success = await webrtc.connectLocalOnly()
    setIsConnected(success)
    return success
  }, [webrtc])

  const toggleMute = useCallback(() => {
    const muted = webrtc.toggleMute()
    setIsMuted(muted)
    return muted
  }, [webrtc])

  const disconnect = useCallback(() => {
    webrtc.disconnect()
    setIsConnected(false)
    setIsMuted(false)
    setRemoteUsers([])
  }, [webrtc])

  useEffect(() => {
    webrtc.onConnectionStateChange = (state) => {
      setIsConnected(state === 'connected')
    }
    webrtc.onRemoteUser = (user) => {
      setRemoteUsers((prev) => [...prev.filter((u) => u.id !== user.id), user])
    }
    webrtc.onUserLeft = (userId) => {
      setRemoteUsers((prev) => prev.filter((u) => u.id !== userId))
    }
    return () => {
      webrtc.disconnect()
    }
  }, [webrtc])

  return {
    connect,
    connectLocalOnly,
    disconnect,
    toggleMute,
    setVolume: webrtc.setVolume.bind(webrtc),
    isConnected,
    isMuted,
    remoteUsers,
  }
}
