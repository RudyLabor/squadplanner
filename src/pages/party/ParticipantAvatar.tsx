import { m } from 'framer-motion'
import { MicOff } from '../../components/icons'
export function ParticipantAvatar({
  username,
  isSpeaking,
  isMuted,
  isLocal,
  size = 'md',
}: {
  username: string
  isSpeaking: boolean
  isMuted: boolean
  isLocal?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = { sm: 'w-12 h-12', md: 'w-16 h-16', lg: 'w-20 h-20' }
  const textSizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-xl' }

  return (
    <m.div
      className="flex flex-col items-center gap-2"
      animate={isSpeaking ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3, repeat: isSpeaking ? 3 : 0 }}
    >
      <div className="relative">
        {isSpeaking && (
          <m.div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-success`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 1, repeat: 2 }}
          />
        )}
        <div
          className={`relative ${sizeClasses[size]} rounded-full flex items-center justify-center ${isSpeaking ? 'bg-success ring-2 ring-success/25 shadow-glow-success' : isLocal ? 'bg-primary' : 'bg-primary/30'} transition-interactive`}
        >
          <span
            className={`${textSizes[size]} font-bold ${isSpeaking || isLocal ? 'text-white' : 'text-primary'}`}
          >
            {username.charAt(0).toUpperCase()}
          </span>
          {isMuted && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-error flex items-center justify-center">
              <MicOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      </div>
      <span className={`text-xs font-medium ${isLocal ? 'text-primary' : 'text-text-secondary'}`}>
        {isLocal ? 'Toi' : username}
      </span>
    </m.div>
  )
}
