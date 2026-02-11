import { Loader2 } from '../icons'
import { InviteUserItem } from './InviteUserItem'

export interface SquadMember {
  id: string
  username: string
  avatar_url: string | null
  is_online: boolean
  voice_channel_id: string | null
}

interface InviteUserListProps {
  members: SquadMember[]
  loading: boolean
  invitedMembers: Set<string>
  sendingInvite: string | null
  onInvite: (memberId: string) => void
}

export function InviteUserList({ members, loading, invitedMembers, sendingInvite, onInvite }: InviteUserListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-md text-text-secondary">
          Tous les membres sont déjà dans la party !
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-text-tertiary mb-3 uppercase tracking-wide font-medium">
        Membres de la squad ({members.length})
      </p>
      {members.map((member) => (
        <InviteUserItem
          key={member.id}
          member={member}
          isInvited={invitedMembers.has(member.id)}
          isSending={sendingInvite === member.id}
          onInvite={onInvite}
        />
      ))}
    </div>
  )
}
