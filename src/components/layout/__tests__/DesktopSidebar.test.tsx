import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

vi.mock('../../icons', () => {
  const icon = (props: any) => createElement('span', props)
  return {
    Home: icon, Users: icon, Mic: icon, MessageCircle: icon,
    User: icon, Plus: icon, Pin: icon, PinOff: icon,
    Settings: icon, HelpCircle: icon, Phone: icon, Calendar: icon, Compass: icon,
  }
})

vi.mock('../../../lib/queryClient', () => ({
  prefetchRoute: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../SquadPlannerLogo', () => ({
  SquadPlannerLogo: () => createElement('span', null, 'Logo'),
}))

vi.mock('../../ui/Tooltip', () => ({
  Tooltip: ({ children }: any) => children,
}))

vi.mock('../SidebarFooter', () => ({
  SidebarFooter: () => createElement('footer', null, 'SidebarFooter'),
}))

import { DesktopSidebar } from '../DesktopSidebar'

describe('DesktopSidebar', () => {
  const defaultProps = {
    isExpanded: true,
    sidebarPinned: false,
    currentPath: '/home',
    unreadMessages: 0,
    pendingRsvpCount: 0,
    userId: 'u1',
    profile: { username: 'Test', avatar_url: null, reliability_score: 100 },
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
    onTogglePinned: vi.fn(),
    onOpenCreateSessionModal: vi.fn(),
    onOpenCustomStatus: vi.fn(),
  }

  it('renders without crash', () => {
    const { container } = render(<DesktopSidebar {...defaultProps} />)
    expect(container).toBeTruthy()
  })
})
