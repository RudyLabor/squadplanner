import { m } from 'framer-motion'
import { Check, Loader2, Send } from 'lucide-react'
import { Button } from '../ui'

interface InviteUserItemProps {
  member: {
    id: string
    username: string
    avatar_url: string | null
    is_online: boolean
  }
  isInvited: boolean
  isSending: boolean
  onInvite: (memberId: string) => void
}

export function InviteUserItem({ member, isInvited, isSending, onInvite }: InviteUserItemProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-overlay-faint hover:bg-overlay-subtle transition-colors"
    >
      {/* Avatar */}
      <div className="relative">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.username}
            className="w-10 h-10 rounded-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-md font-semibold text-primary">
              {member.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Online indicator */}
        {member.is_online && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-bg-base" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-md font-medium text-text-primary truncate">
          {member.username}
        </p>
        <p className="text-sm text-text-tertiary">
          {member.is_online ? 'En ligne' : 'Hors ligne'}
        </p>
      </div>

      {/* Invite button */}
      <Button
        size="sm"
        variant={isInvited ? 'ghost' : 'primary'}
        onClick={() => !isInvited && onInvite(member.id)}
        disabled={isInvited || isSending}
        className={isInvited ? 'text-success bg-success-10' : ''}
      >
        {isSending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isInvited ? (
          <>
            <Check className="w-4 h-4" />
            Invite
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Inviter
          </>
        )}
      </Button>
    </m.div>
  )
}
