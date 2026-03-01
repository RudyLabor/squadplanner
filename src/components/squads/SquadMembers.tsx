import { memo, useState, useRef, useEffect } from 'react'
import { Users, MessageCircle, Phone, Crown, TrendingUp, UserPlus, Crosshair, GraduationCap, Megaphone, ChevronDown } from '../icons'
import { useNavigate } from 'react-router'
import { Button, Card, CardContent } from '../ui'
import { PremiumGate } from '../PremiumGate'
import { getRoleConfig, isAdvancedRole, ASSIGNABLE_ROLES, type SquadRole } from '../../lib/roles'
import { useUpdateMemberRoleMutation } from '../../hooks/queries'
// LAZY LOAD: useVoiceCall importé uniquement si call button cliqué
// import { useVoiceCallStore } from '../../hooks/useVoiceCall'

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
  squadId: string
  memberCount: number
  currentUserId?: string
  /** Whether the current user is the squad leader */
  isLeader: boolean
  /** Whether the squad owner has premium access for advanced roles */
  canUseAdvancedRoles: boolean
  onInviteClick: () => void
}

export function SquadMembers({
  members,
  ownerId,
  squadId,
  memberCount,
  currentUserId,
  isLeader,
  canUseAdvancedRoles,
  onInviteClick,
}: SquadMembersProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary">Membres ({memberCount})</h2>
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
              isLeader={isLeader}
              canUseAdvancedRoles={canUseAdvancedRoles}
              squadId={squadId}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/** Lucide icon component for a given role */
function RoleIcon({ role, className }: { role: string; className?: string }) {
  const config = getRoleConfig(role)
  if (!config.lucideIcon) return null

  switch (config.lucideIcon) {
    case 'Crosshair':
      return <Crosshair className={className} aria-hidden="true" />
    case 'GraduationCap':
      return <GraduationCap className={className} aria-hidden="true" />
    case 'Megaphone':
      return <Megaphone className={className} aria-hidden="true" />
    default:
      return null
  }
}

/** Badge showing the member's role */
function RoleBadge({ role }: { role: string }) {
  const config = getRoleConfig(role)
  // Don't show badge for plain members
  if (role === 'member') return null

  const isAdvanced = isAdvancedRole(role as SquadRole)

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
      }}
      title={config.description}
    >
      {isAdvanced ? (
        <RoleIcon role={role} className="w-3 h-3" />
      ) : config.icon ? (
        <span className="text-[10px] leading-none">{config.icon}</span>
      ) : null}
      {config.shortLabel}
    </span>
  )
}

/** Dropdown for a leader to change a member's role */
function RoleAssignDropdown({
  member,
  squadId,
  canUseAdvancedRoles,
}: {
  member: Member
  squadId: string
  canUseAdvancedRoles: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const updateRoleMutation = useUpdateMemberRoleMutation()

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSelectRole = (newRole: SquadRole) => {
    // If trying to assign an advanced role without premium, show gate
    if (isAdvancedRole(newRole) && !canUseAdvancedRoles) {
      setShowPremiumGate(true)
      setIsOpen(false)
      return
    }

    setIsOpen(false)
    if (newRole === member.role) return

    updateRoleMutation.mutate({
      squadId,
      memberId: member.user_id,
      newRole,
    })
  }

  const currentConfig = getRoleConfig(member.role)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium hover:bg-bg-hover transition-colors min-h-[32px]"
        aria-label={`Changer le rôle de ${member.profiles?.username || 'ce joueur'}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span style={{ color: currentConfig.color }}>{currentConfig.shortLabel}</span>
        <ChevronDown className="w-3 h-3 text-text-tertiary" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-bg-elevated border border-border-default shadow-xl z-50 py-1 overflow-hidden"
          role="listbox"
          aria-label="Sélectionner un rôle"
        >
          {ASSIGNABLE_ROLES.map((role) => {
            const config = getRoleConfig(role)
            const isSelected = role === member.role
            const advanced = isAdvancedRole(role)
            const locked = advanced && !canUseAdvancedRoles

            return (
              <button
                key={role}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectRole(role)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-hover transition-colors ${
                  isSelected ? 'bg-primary/10' : ''
                } ${locked ? 'opacity-60' : ''}`}
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.bgColor }}>
                  {config.lucideIcon ? (
                    <RoleIcon role={role} className="w-4 h-4" />
                  ) : config.icon ? (
                    <span className="text-sm">{config.icon}</span>
                  ) : (
                    <Users className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-text-primary">{config.label}</span>
                    {advanced && (
                      <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-warning/15 text-warning leading-none">
                        PRO
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-tertiary">{config.description}</span>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Premium gate shown when trying to assign an advanced role without premium */}
      {showPremiumGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-dark-60" onClick={() => setShowPremiumGate(false)}>
          <div className="mx-4 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <PremiumGate feature="advanced_roles" squadId={squadId} fallback="lock">
              <div />
            </PremiumGate>
            <button
              onClick={() => setShowPremiumGate(false)}
              className="mt-3 w-full text-center text-sm text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const MemberCard = memo(function MemberCard({
  member,
  isOwner,
  currentUserId,
  isLeader,
  canUseAdvancedRoles,
  squadId,
}: {
  member: Member
  isOwner: boolean
  currentUserId?: string
  isLeader: boolean
  canUseAdvancedRoles: boolean
  squadId: string
}) {
  const navigate = useNavigate()
  // LAZY LOAD: useVoiceCall sera importé dans handleCall
  const reliability = member.profiles?.reliability_score ?? 100
  const isCurrentUser = member.user_id === currentUserId
  const isMemberLeader = member.role === 'leader'

  const handleCall = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!member.profiles?.username) return

    // LAZY LOAD: Import voice call uniquement au clic d'appel
    const { useVoiceCallStore } = await import('../../hooks/useVoiceCall')
    const { startCall } = useVoiceCallStore.getState()
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
          <span className="text-base font-medium text-text-primary truncate">
            {member.profiles?.username || 'Joueur'}
          </span>
          {isOwner && <Crown className="w-4 h-4 text-warning" />}
          <RoleBadge role={member.role} />
        </div>
        <div className="flex items-center gap-1 text-sm">
          <TrendingUp
            className={`w-3 h-3 ${reliability >= 80 ? 'text-success' : reliability >= 60 ? 'text-warning' : 'text-error'}`}
          />
          <span
            className={
              reliability >= 80 ? 'text-success' : reliability >= 60 ? 'text-warning' : 'text-error'
            }
          >
            {reliability}%
          </span>
          <span className="text-text-quaternary">fiable</span>
        </div>
      </div>

      {/* Role assignment dropdown — visible only to leader, for non-leader members */}
      {isLeader && !isMemberLeader && !isCurrentUser && (
        <RoleAssignDropdown
          member={member}
          squadId={squadId}
          canUseAdvancedRoles={canUseAdvancedRoles}
        />
      )}

      {/* Boutons d'action - seulement si ce n'est pas l'utilisateur courant */}
      {!isCurrentUser && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleMessage}
            className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-bg-hover transition-colors flex items-center justify-center"
            aria-label={`Envoyer un message à ${member.profiles?.username || 'ce joueur'}`}
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
