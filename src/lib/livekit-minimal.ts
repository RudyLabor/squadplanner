import { useState, useCallback } from 'react'

// LAZY LOADING - Pas d'import statique pour éviter bundle bloat!
// Room, RoomEvent, etc. importés dynamiquement quand nécessaire

// PAS d'import du package components-react complet
// On rebuild nos components minimalistes

export class MinimalLiveKit {
  private room: any = null
  private isConnected = false
  
  async connect(token: string, wsUrl: string) {
    if (this.room) return this.room
    
    // LAZY LOAD: Import uniquement quand voice chat est activé
    const { Room, RoomEvent, AudioPresets } = await import('livekit-client')
    
    this.room = new Room({
      // Options minimales
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: {
        audioPreset: AudioPresets.music
      }
    })
    
    // Events essentiels seulement
    this.room.on(RoomEvent.Connected, () => {
      this.isConnected = true
    })
    
    await this.room.connect(wsUrl, token)
    return this.room
  }
  
  async enableMicrophone() {
    if (!this.room) throw new Error('Not connected')
    
    const { AudioPresets } = await import('livekit-client')
    
    const audioTrack = await this.room.localParticipant.createAudioTrack({
      preset: AudioPresets.music
    })
    
    await this.room.localParticipant.publishTrack(audioTrack)
    return audioTrack
  }
  
  toggleMute() {
    if (!this.room) return false
    
    const audioTrack = this.room.localParticipant.getTrackBySource('microphone')
    if (audioTrack) {
      audioTrack.mute(!audioTrack.isMuted)
      return audioTrack.isMuted
    }
    return false
  }
  
  disconnect() {
    if (this.room) {
      this.room.disconnect()
      this.room = null
      this.isConnected = false
    }
  }
  
  getParticipants() {
    return this.room?.participants || []
  }
}

// Hook minimal
export function useMinimalLiveKit(token?: string, wsUrl?: string) {
  const [livekit] = useState(() => new MinimalLiveKit())
  const [participants, setParticipants] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  
  const connect = useCallback(async () => {
    if (!token || !wsUrl) return
    
    try {
      await livekit.connect(token, wsUrl)
      setIsConnected(true)
      setParticipants(livekit.getParticipants())
    } catch (error) {
      console.error('LiveKit connection failed:', error)
    }
  }, [token, wsUrl])
  
  const disconnect = useCallback(() => {
    livekit.disconnect()
    setIsConnected(false)
    setParticipants([])
  }, [])
  
  return {
    connect,
    disconnect,
    toggleMute: () => livekit.toggleMute(),
    enableMicrophone: () => livekit.enableMicrophone(),
    participants,
    isConnected
  }
}