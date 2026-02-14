import { describe, it, expect } from 'vitest'
import { ROLE_CONFIG, hasPermission, getRoleConfig, getPromotableRoles, canManageMember } from '../roles'

describe('roles', () => {
  it('ROLE_CONFIG has 4 roles', () => {
    expect(Object.keys(ROLE_CONFIG)).toHaveLength(4)
  })

  it('leader has highest level', () => {
    expect(ROLE_CONFIG.leader.level).toBe(4)
  })

  it('member has lowest level', () => {
    expect(ROLE_CONFIG.member.level).toBe(1)
  })

  describe('hasPermission', () => {
    it('leader can delete squad', () => {
      expect(hasPermission('leader', 'delete_squad')).toBe(true)
    })

    it('member cannot delete squad', () => {
      expect(hasPermission('member', 'delete_squad')).toBe(false)
    })

    it('member can create session', () => {
      expect(hasPermission('member', 'create_session')).toBe(true)
    })

    it('moderator can kick member', () => {
      expect(hasPermission('moderator', 'kick_member')).toBe(true)
    })
  })

  describe('getRoleConfig', () => {
    it('returns config for valid role', () => {
      expect(getRoleConfig('leader').label).toBe('Leader')
    })

    it('returns member config for unknown role', () => {
      expect(getRoleConfig('unknown').label).toBe('Membre')
    })
  })

  describe('getPromotableRoles', () => {
    it('leader can promote to all lower roles', () => {
      const roles = getPromotableRoles('leader')
      expect(roles).toContain('co_leader')
      expect(roles).toContain('moderator')
      expect(roles).toContain('member')
    })

    it('member cannot promote anyone', () => {
      expect(getPromotableRoles('member')).toHaveLength(0)
    })
  })

  describe('canManageMember', () => {
    it('leader can manage co_leader', () => {
      expect(canManageMember('leader', 'co_leader')).toBe(true)
    })

    it('member cannot manage anyone', () => {
      expect(canManageMember('member', 'member')).toBe(false)
    })
  })
})
