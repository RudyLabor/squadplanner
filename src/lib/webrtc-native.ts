// REPLACEMENT LIVEKIT → WebRTC natif 
// Gain attendu : -450KB bundle size

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

  // Events
  onConnectionStateChange?: (state: string) => void
  onRemoteUser?: (user: VoiceUser) => void
  onUserLeft?: (userId: string) => void
  onSpeaking?: (userId: string, isSpeaking: boolean) => void

  constructor(config: WebRTCConfig) {
    this.config = config
  }
  
  async connect(token: string, roomName: string): Promise<boolean> {
    try {
      // Configuration STUN/TURN simplifiée
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.config.iceServers || [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      })
      
      // Event handlers
      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState || 'disconnected'
        this.isConnected = state === 'connected'
        this.onConnectionStateChange?.(state)
      }
      
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0]
        // Auto-play remote audio
        const audio = new Audio()
        audio.srcObject = this.remoteStream
        audio.play()
      }
      
      await this.enableMicrophone()
      return true
      
    } catch (error) {
      if (!import.meta.env.PROD) console.error('[NativeWebRTC] Connection failed:', error)
      return false
    }
  }
  
  async enableMicrophone(): Promise<boolean> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream)
        }
      })
      
      // Voice activity detection
      this.setupVoiceActivityDetection()
      
      return true
    } catch (error) {
      if (!import.meta.env.PROD) console.error('[NativeWebRTC] Microphone access failed:', error)
      return false
    }
  }
  
  toggleMute(): boolean {
    if (!this.localStream) return false
    
    const audioTrack = this.localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      this.isMuted = !audioTrack.enabled
      return this.isMuted
    }
    return false
  }
  
  setVolume(volume: number): void {
    // Implementation via Web Audio API si nécessaire
    if (!import.meta.env.PROD) console.log('[NativeWebRTC] Volume set to:', volume)
  }
  
  disconnect(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
    
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
    
    this.isConnected = false
    this.isMuted = false
  }
  
  private setupVoiceActivityDetection(): void {
    if (!this.localStream) return
    
    // Simple VAD avec AudioContext
    try {
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(this.localStream)
      
      analyser.fftSize = 512
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      microphone.connect(analyser)
      
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        
        // Calculate RMS
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i]
        }
        const rms = Math.sqrt(sum / bufferLength)
        
        // Threshold for speaking detection
        const isSpeaking = rms > 10
        this.onSpeaking?.('local', isSpeaking)
        
        if (this.isConnected) {
          requestAnimationFrame(checkAudioLevel)
        }
      }
      
      checkAudioLevel()
    } catch (error) {
      if (!import.meta.env.PROD) console.warn('[NativeWebRTC] VAD setup failed:', error)
    }
  }
  
  // Getters
  get connected(): boolean { return this.isConnected }
  get muted(): boolean { return this.isMuted }
}

// Hook React pour WebRTC natif
import { useState, useCallback, useEffect } from 'react'

export function useNativeWebRTC() {
  const [webrtc] = useState(() => new NativeWebRTC({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }))
  
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<VoiceUser[]>([])
  
  const connect = useCallback(async (token: string, roomName: string) => {
    const success = await webrtc.connect(token, roomName)
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
      setRemoteUsers(prev => [...prev.filter(u => u.id !== user.id), user])
    }
    
    webrtc.onUserLeft = (userId) => {
      setRemoteUsers(prev => prev.filter(u => u.id !== userId))
    }
    
    return () => {
      webrtc.disconnect()
    }
  }, [webrtc])
  
  return {
    connect,
    disconnect,
    toggleMute,
    setVolume: webrtc.setVolume.bind(webrtc),
    isConnected,
    isMuted,
    remoteUsers
  }
}