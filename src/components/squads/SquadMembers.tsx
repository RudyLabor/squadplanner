import { memo } from 'react'
import {
  Users,
  MessageCircle,
  Phone,
  Crown,
  TrendingUp,
  UserPlus,
} from '../icons'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent } from '../ui'
import { useVoiceCallStore } from '../../hooks'

interface MemberProfile {
  username?: string
  avatar_url?: string
  reliability_score?: number
}

interface Member {
  user_id: string
  role: string
  profiles?: MemberProfile
}

interface SquadMembersProps {
  members: Member[]
  ownerId: string
  memberCount: number
  currentUserId?: string
  onInviteClick: () => void
}

export function SquadMembers({ members, ownerId, memberCount, currentUserId, onInviteClick }: SquadMembersProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary uppercase tracking-wide">
          Membres ({memberCount})
        </h2>
        <Button size="sm" variant="secondary" onClick={onInviteClick}>
          <UserPlus className="w-4 h-4" />
          Inviter
        </Button>
      </div>
      <Card>
        <CardContent className="p-4 divide-y divide-border-default">
          {members?.map((member) => (
            <MemberCard
              key={member.user_id}
              member={member}
              isOwner={member.role === 'leader' || member.user_id === ownerId}
              currentUserId={currentUserId}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

const MemberCard = memo(function MemberCard({ member, isOwner, currentUserId }: {
  member: Member
  isOwner: boolean
  currentUserId?: string
}) {
  const navigate = useNavigate()
  const { startCall } = useVoiceCallStore()
  const reliability = member.profiles?.reliability_score ?? 100
  const isCurrentUser = member.user_id === currentUserId

  const handleCall = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!member.profiles?.username) return
    await startCall(member.user_id, member.profiles.username, member.profiles.avatar_url)
  }

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/messages?dm=${member.user_id}`)
  }

  return (
    <div className="flex items-center gap-3 py-2">
      {member.profiles?.avatar_url ? (
        <img
          src={member.profiles.avatar_url}
          alt={member.profiles.username || 'Avatar'}
          className="w-10 h-10 rounded-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-md font-medium text-text-primary truncate">
            {member.profiles?.username || 'Joueur'}
          </span>
          {isOwner && <Crown className="w-4 h-4 text-warning" />}
        </div>
        <div className="flex items-center gap-1 text-sm">
          <TrendingUp className={`w-3 h-3 ${reliability >= 80 ? 'text-success' : reliability >= 60 ? 'text-warning' : 'text-error'}`} />
          <span className={reliability >= 80 ? 'text-success' : reliability >= 60 ? 'text-warning' : 'text-error'}>
            {reliability}%
          </span>
          <span className="text-text-quaternary">fiable</span>
        </div>
      </div>
      {/* Boutons d'action - seulement si ce n'est pas l'utilisateur courant */}
      {!isCurrentUser && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleMessage}
            className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-bg-hover transition-colors flex items-center justify-center"
            aria-label={`Envoyer un message a ${member.profiles?.username || 'ce joueur'}`}
          >
            <MessageCircle className="w-5 h-5 text-primary" aria-hidden="true" />
          </button>
          <button
            onClick={handleCall}
            className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-bg-hover transition-colors flex items-center justify-center"
            aria-label={`Appeler ${member.profiles?.username || 'ce joueur'}`}
          >
            <Phone className="w-5 h-5 text-success" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
})
