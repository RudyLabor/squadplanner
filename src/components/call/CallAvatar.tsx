import { m } from 'framer-motion'
import { Phone } from '../icons'
interface CallAvatarProps {
  status: string
  avatarUrl?: string | null
  username?: string
  initial: string
}

export function CallAvatar({ status, avatarUrl, username, initial }: CallAvatarProps) {
  return (
    <m.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="relative mb-8"
    >
      {/* Pulse animation for calling state - single subtle animation */}
      {status === 'calling' && (
        <m.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.4, 1.4],
            opacity: [0.4, 0, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: 3,
            ease: 'easeOut',
          }}
        />
      )}

      {/* Connected indicator */}
      {status === 'connected' && (
        <m.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success border-4 border-bg-base flex items-center justify-center"
        >
          <Phone className="w-3 h-3 text-white" />
        </m.div>
      )}

      {/* Avatar image or initial */}
      <div className="w-32 h-32 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="text-3xl font-bold text-primary">{initial}</span>
        )}
      </div>
    </m.div>
  )
}
