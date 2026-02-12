/**
 * Roles & Permissions System — Phase 3.3
 *
 * Defines squad member roles with colors, labels, and permission levels.
 * Roles hierarchy: leader > co_leader > moderator > member
 */

export type SquadRole = 'leader' | 'co_leader' | 'moderator' | 'member'

export interface RoleConfig {
  label: string
  shortLabel: string
  color: string
  bgColor: string
  icon: string // emoji for simplicity
  level: number // higher = more permissions
}

export const ROLE_CONFIG: Record<SquadRole, RoleConfig> = {
  leader: {
    label: 'Leader',
    shortLabel: 'Lead',
    color: 'var(--color-warning)',
    bgColor: 'var(--color-warning-15)',
    icon: '👑',
    level: 4,
  },
  co_leader: {
    label: 'Co-Leader',
    shortLabel: 'Co-Lead',
    color: 'var(--color-warning)',
    bgColor: 'var(--color-warning-15)',
    icon: '⭐',
    level: 3,
  },
  moderator: {
    label: 'Modérateur',
    shortLabel: 'Mod',
    color: 'var(--color-primary-hover)',
    bgColor: 'var(--color-primary-15)',
    icon: '🛡️',
    level: 2,
  },
  member: {
    label: 'Membre',
    shortLabel: 'Membre',
    color: 'var(--color-text-secondary)',
    bgColor: 'var(--color-primary-10)',
    icon: '',
    level: 1,
  },
}

// Permission types
export type Permission =
  | 'create_session'
  | 'delete_session'
  | 'invite_member'
  | 'kick_member'
  | 'promote_member'
  | 'pin_message'
  | 'delete_any_message'
  | 'manage_squad'
  | 'delete_squad'
  | 'mute_member'

// Permission matrix: which roles can do what
const PERMISSIONS: Record<Permission, number> = {
  create_session: 1, // everyone
  delete_session: 3, // co_leader+
  invite_member: 1, // everyone
  kick_member: 2, // moderator+
  promote_member: 3, // co_leader+
  pin_message: 2, // moderator+
  delete_any_message: 2, // moderator+
  manage_squad: 3, // co_leader+
  delete_squad: 4, // leader only
  mute_member: 2, // moderator+
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: SquadRole, permission: Permission): boolean {
  const roleLevel = ROLE_CONFIG[role]?.level ?? 0
  const requiredLevel = PERMISSIONS[permission] ?? 999
  return roleLevel >= requiredLevel
}

/**
 * Get the role config for a given role string
 */
export function getRoleConfig(role: string): RoleConfig {
  return ROLE_CONFIG[role as SquadRole] || ROLE_CONFIG.member
}

/**
 * Get roles that a user with this role can promote others to
 */
export function getPromotableRoles(myRole: SquadRole): SquadRole[] {
  const myLevel = ROLE_CONFIG[myRole].level
  return (Object.keys(ROLE_CONFIG) as SquadRole[]).filter((r) => ROLE_CONFIG[r].level < myLevel)
}

/**
 * Check if user A can manage user B (promote/demote/kick)
 */
export function canManageMember(myRole: SquadRole, targetRole: SquadRole): boolean {
  return ROLE_CONFIG[myRole].level > ROLE_CONFIG[targetRole].level
}
