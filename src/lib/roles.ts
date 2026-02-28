/**
 * Roles & Permissions System — Phase 3.3 + Advanced Roles (Premium)
 *
 * Defines squad member roles with colors, labels, and permission levels.
 * Base roles hierarchy: leader > co_leader > moderator > member
 * Advanced roles (Premium): igl, coach, shotcaller — cosmetic/functional overlays
 *   - igl: same permissions as co_leader (level 3) + can mark sessions as "IGL picks"
 *   - coach: same permissions as moderator (level 2) + can view extended stats
 *   - shotcaller: same permissions as member (level 1) but with a special badge
 */

export type SquadRole = 'leader' | 'co_leader' | 'moderator' | 'member' | 'igl' | 'coach' | 'shotcaller'

export interface RoleConfig {
  label: string
  shortLabel: string
  description: string
  color: string
  bgColor: string
  icon: string // emoji for simplicity
  /** Lucide icon name for React component rendering */
  lucideIcon?: 'Crosshair' | 'GraduationCap' | 'Megaphone'
  level: number // higher = more permissions
}

export const ROLE_CONFIG: Record<SquadRole, RoleConfig> = {
  leader: {
    label: 'Leader',
    shortLabel: 'Lead',
    description: 'Propriétaire de la squad',
    color: 'var(--color-warning)',
    bgColor: 'var(--color-warning-15)',
    icon: '\u{1F451}',
    level: 4,
  },
  co_leader: {
    label: 'Co-Leader',
    shortLabel: 'Co-Lead',
    description: 'Seconde le leader',
    color: 'var(--color-warning)',
    bgColor: 'var(--color-warning-15)',
    icon: '\u2B50',
    level: 3,
  },
  igl: {
    label: 'IGL',
    shortLabel: 'IGL',
    description: 'Dirige la strat\u00e9gie en jeu',
    color: 'var(--color-error)',
    bgColor: 'var(--color-error-15)',
    icon: '\u{1F3AF}',
    lucideIcon: 'Crosshair',
    level: 3,
  },
  moderator: {
    label: 'Mod\u00e9rateur',
    shortLabel: 'Mod',
    description: 'Mod\u00e8re les \u00e9changes',
    color: 'var(--color-primary-hover)',
    bgColor: 'var(--color-primary-15)',
    icon: '\u{1F6E1}\uFE0F',
    level: 2,
  },
  coach: {
    label: 'Coach',
    shortLabel: 'Coach',
    description: 'Analyse les performances',
    color: 'var(--color-info)',
    bgColor: 'var(--color-info-15)',
    icon: '\u{1F393}',
    lucideIcon: 'GraduationCap',
    level: 2,
  },
  member: {
    label: 'Membre',
    shortLabel: 'Membre',
    description: 'Membre de la squad',
    color: 'var(--color-text-secondary)',
    bgColor: 'var(--color-primary-10)',
    icon: '',
    level: 1,
  },
  shotcaller: {
    label: 'Shotcaller',
    shortLabel: 'Shot',
    description: 'Appelle les actions cl\u00e9s',
    color: 'var(--color-success)',
    bgColor: 'var(--color-success-15)',
    icon: '\u{1F4E3}',
    lucideIcon: 'Megaphone',
    level: 1,
  },
}

/** Advanced roles that require a Premium (Squad Leader tier) subscription */
export const ADVANCED_ROLES: SquadRole[] = ['igl', 'coach', 'shotcaller']

/**
 * Check if a role is an advanced (premium-only) role
 */
export function isAdvancedRole(role: SquadRole): boolean {
  return ADVANCED_ROLES.includes(role)
}

/** All roles available for assignment by a leader (excludes 'leader' itself) */
export const ASSIGNABLE_ROLES: SquadRole[] = [
  'co_leader',
  'igl',
  'moderator',
  'coach',
  'member',
  'shotcaller',
]

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
  delete_session: 3, // co_leader+ / igl
  invite_member: 1, // everyone
  kick_member: 2, // moderator+ / coach
  promote_member: 3, // co_leader+ / igl
  pin_message: 2, // moderator+ / coach
  delete_any_message: 2, // moderator+ / coach
  manage_squad: 3, // co_leader+ / igl
  delete_squad: 4, // leader only
  mute_member: 2, // moderator+ / coach
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
