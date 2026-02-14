import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock roles lib
vi.mock('../../lib/roles', () => ({
  getRoleConfig: vi.fn().mockImplementation((role: string) => {
    const configs: Record<string, any> = {
      leader: { color: '#FFD700', bgColor: '#FFF8E1', icon: '👑', shortLabel: 'Leader' },
      co_leader: { color: '#C0C0C0', bgColor: '#F5F5F5', icon: '🛡️', shortLabel: 'Co-Leader' },
      moderator: { color: '#2196F3', bgColor: '#E3F2FD', icon: '⚔️', shortLabel: 'Modérateur' },
      member: { color: '#9E9E9E', bgColor: '#FAFAFA', icon: '', shortLabel: 'Membre' },
    }
    return configs[role] || configs.member
  }),
}))

// Mock Tooltip
vi.mock('../ui', () => ({
  Tooltip: ({ children }: any) => children,
}))

import { RoleBadge } from '../RoleBadge'

describe('RoleBadge', () => {
  it('renders nothing for member role', () => {
    const { container } = render(createElement(RoleBadge, { role: 'member' }))
    expect(container.innerHTML).toBe('')
  })

  it('renders leader badge', () => {
    render(createElement(RoleBadge, { role: 'leader' }))
    expect(screen.getByText('Leader')).toBeDefined()
  })

  it('renders co_leader badge', () => {
    render(createElement(RoleBadge, { role: 'co_leader' }))
    expect(screen.getByText('Co-Leader')).toBeDefined()
  })

  it('renders moderator badge', () => {
    render(createElement(RoleBadge, { role: 'moderator' }))
    expect(screen.getByText('Modérateur')).toBeDefined()
  })

  it('renders icon when showIcon is true', () => {
    render(createElement(RoleBadge, { role: 'leader', showIcon: true }))
    expect(screen.getByText('👑')).toBeDefined()
  })

  it('supports md size', () => {
    const { container } = render(createElement(RoleBadge, { role: 'leader', size: 'md' }))
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-sm')
  })
})
