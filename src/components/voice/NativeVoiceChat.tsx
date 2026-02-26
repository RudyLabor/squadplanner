import { useState, useEffect } from 'react'
import { useNativeWebRTC } from '../../lib/webrtc-native'
import { AppleButton } from '../../lib/motionApple'
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from '../icons'

interface NativeVoiceChatProps {
  isOpen: boolean
  onClose: () => void
  roomName: string
  token: string
  userName: string
}

export function NativeVoiceChat({
  isOpen,
  onClose,
  roomName,
  token,
  userName,
}: NativeVoiceChatProps) {
  const { connectLocalOnly, disconnect, toggleMute, isConnected, isMuted, remoteUsers } =
    useNativeWebRTC()

  const [connectionState, setConnectionState] = useState<
    'idle' | 'connecting' | 'connected' | 'failed'
  >('idle')

  useEffect(() => {
    if (isOpen && roomName) {
      setConnectionState('connecting')
      connectLocalOnly()
        .then((success) => {
          setConnectionState(success ? 'connected' : 'failed')
        })
        .catch(() => setConnectionState('failed'))
    } else if (!isOpen) {
      disconnect()
      setConnectionState('idle')
    }
  }, [isOpen, roomName, connectLocalOnly, disconnect])

  const handleEndCall = () => {
    disconnect()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
        {/* Call Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-semibold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{userName}</h2>
          <p className="text-gray-500">
            {connectionState === 'connecting' && 'Connexion...'}
            {connectionState === 'connected' && 'Connecté'}
            {connectionState === 'failed' && 'Échec de la connexion'}
            {connectionState === 'idle' && 'Déconnecté'}
          </p>
        </div>

        {/* Remote Users */}
        {remoteUsers.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Dans l'appel :</p>
            {remoteUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{user.username}</span>
                {user.isSpeaking && (
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-4 bg-green-500 rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          <AppleButton
            variant="gentle"
            onClick={() => toggleMute()}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-gray-200 text-gray-600' : 'bg-primary/10 text-primary'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </AppleButton>

          <AppleButton
            variant="snappy"
            onClick={handleEndCall}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
          >
            <PhoneOff className="w-6 h-6" />
          </AppleButton>

          <AppleButton
            variant="gentle"
            onClick={() => {
              /* Volume control */
            }}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 text-gray-600"
          >
            <Volume2 className="w-6 h-6" />
          </AppleButton>
        </div>

        {/* Connection Debug (dev only) */}
        {!import.meta.env.PROD && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <p>Debug: {connectionState}</p>
            <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
            <p>Muted: {isMuted ? 'Yes' : 'No'}</p>
            <p>Remote users: {remoteUsers.length}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook pour remplacer useVoiceCall avec WebRTC natif
export function useNativeVoiceCall() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [callData, setCallData] = useState<{
    roomName: string
    token: string
    userName: string
  } | null>(null)

  const startCall = async (userId: string, userName: string, avatarUrl?: string | null) => {
    try {
      // Simulate token generation (in real app, call Supabase function)
      const roomName = `call_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const token = `token_${userId}_${Date.now()}` // Dummy token

      setCallData({
        roomName,
        token,
        userName,
      })
      setIsCallActive(true)

      if (!import.meta.env.PROD) console.log(`[NativeVoiceCall] Starting call with ${userName}`)
      return true
    } catch (error) {
      if (!import.meta.env.PROD) console.error('[NativeVoiceCall] Failed to start call:', error)
      return false
    }
  }

  const endCall = () => {
    setIsCallActive(false)
    setCallData(null)
  }

  return {
    isCallActive,
    callData,
    startCall,
    endCall,
  }
}
