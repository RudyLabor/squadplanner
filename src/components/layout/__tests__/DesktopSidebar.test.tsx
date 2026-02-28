import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, forwardRef } from 'react'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

function makeMotionProxy() {
  const cache = new Map<string, any>()
  return new Proxy(
    {},
    {
      get: (_t: any, p: string) => {
        if (typeof p !== 'string') return undefined
        if (!cache.has(p)) {
          const comp = forwardRef(({ children, ...r }: any, ref: any) =>
            createElement(p, { ...r, ref }, children)
          )
          comp.displayName = `motion.${p}`
          cache.set(p, comp)
        }
        return cache.get(p)
      },
    }
  )
}

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  m: makeMotionProxy(),
  motion: makeMotionProxy(),
}))

vi.mock('../../icons', () => {
  const icon = (props: any) => createElement('span', props)
  return {
    Home: icon,
    Users: icon,
    Mic: icon,
    MessageCircle: icon,
    User: icon,
    Plus: icon,
    Pin: icon,
    PinOff: icon,
    Settings: icon,
    HelpCircle: icon,
    Phone: icon,
    Calendar: icon,
    Compass: icon,
    Gift: icon,
  }
})

vi.mock('../../../lib/queryClient', () => ({
  prefetchRoute: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../SquadPlannerLogo', () => ({
  SquadPlannerLogo: () => createElement('span', null, 'Logo'),
}))

vi.mock('../../ui/Tooltip', () => ({
  Tooltip: ({ children, content }: any) => createElement('div', { title: content }, children),
}))

vi.mock('../SidebarFooter', () => ({
  SidebarFooter: () => createElement('footer', null, 'SidebarFooter'),
}))

import { DesktopSidebar, NavLink, navItems } from '../DesktopSidebar'

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

describe('DesktopSidebar', () => {
  // =========================================================================
  // Basic rendering
  // =========================================================================
  describe('basic rendering', () => {
    it('renders aside with navigation label', () => {
      render(<DesktopSidebar {...defaultProps} />)
      expect(screen.getByLabelText('Navigation principale')).toBeInTheDocument()
    })

    it('renders SquadPlannerLogo', () => {
      render(<DesktopSidebar {...defaultProps} />)
      expect(screen.getByText('Logo')).toBeInTheDocument()
    })

    it('renders "Squad Planner" text when expanded', () => {
      render(<DesktopSidebar {...defaultProps} isExpanded={true} />)
      expect(screen.getByText('Squad Planner')).toBeInTheDocument()
    })

    it('renders tagline "Joue avec ta squad" when expanded', () => {
      render(<DesktopSidebar {...defaultProps} isExpanded={true} />)
      expect(screen.getByText('Joue avec ta squad')).toBeInTheDocument()
    })

    it('renders SidebarFooter', () => {
      render(<DesktopSidebar {...defaultProps} />)
      expect(screen.getByText('SidebarFooter')).toBeInTheDocument()
    })

    it('renders main navigation nav element', () => {
      render(<DesktopSidebar {...defaultProps} />)
      expect(screen.getByLabelText('Menu principal')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Navigation items
  // =========================================================================
  describe('navigation items', () => {
    it('renders all 7 main nav items', () => {
      render(<DesktopSidebar {...defaultProps} />)
      expect(screen.getByText('Accueil')).toBeInTheDocument()
      expect(screen.getByText('Squads')).toBeInTheDocument()
      expect(screen.getByText('Sessions')).toBeInTheDocument()
      expect(screen.getByText('Party')).toBeInTheDocument()
      expect(screen.getByText('Messages')).toBeInTheDocument()
      expect(screen.getByText('Découvrir')).toBeInTheDocument()
      expect(screen.getByText('Profil')).toBeInTheDocument()
    })

    it('renders secondary nav items (settings, help, calls)', () => {
      render(<DesktopSidebar {...defaultProps} />)
      expect(screen.getByText('Paramètres')).toBeInTheDocument()
      expect(screen.getByText('Aide')).toBeInTheDocument()
      expect(screen.getByText('Appels')).toBeInTheDocument()
    })

    it('renders links with correct paths', () => {
      render(<DesktopSidebar {...defaultProps} />)
      expect(screen.getByLabelText('Accueil').closest('a')).toHaveAttribute('href', '/home')
      expect(screen.getByLabelText('Squads').closest('a')).toHaveAttribute('href', '/squads')
      expect(screen.getByLabelText('Sessions').closest('a')).toHaveAttribute('href', '/sessions')
      expect(screen.getByLabelText('Party').closest('a')).toHaveAttribute('href', '/party')
      expect(screen.getByLabelText('Messages').closest('a')).toHaveAttribute('href', '/messages')
    })

    it('sets aria-current=page on active nav item', () => {
      render(<DesktopSidebar {...defaultProps} currentPath="/home" />)
      expect(screen.getByLabelText('Accueil').closest('a')).toHaveAttribute('aria-current', 'page')
    })

    it('does not set aria-current on non-active nav items', () => {
      render(<DesktopSidebar {...defaultProps} currentPath="/home" />)
      expect(screen.getByLabelText('Squads').closest('a')).not.toHaveAttribute('aria-current')
    })
  })

  // =========================================================================
  // Badge display
  // =========================================================================
  describe('badges', () => {
    it('shows unread messages badge on Messages nav', () => {
      render(<DesktopSidebar {...defaultProps} unreadMessages={5} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('shows 9+ when unread messages exceed 9', () => {
      render(<DesktopSidebar {...defaultProps} unreadMessages={15} />)
      expect(screen.getByText('9+')).toBeInTheDocument()
    })

    it('shows pendingRsvpCount badge on Squads nav', () => {
      render(<DesktopSidebar {...defaultProps} pendingRsvpCount={3} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('does not show badges when counts are 0', () => {
      render(<DesktopSidebar {...defaultProps} unreadMessages={0} pendingRsvpCount={0} />)
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })

  // =========================================================================
  // Create session button
  // =========================================================================
  describe('create session button', () => {
    it('renders create session button when expanded', () => {
      render(<DesktopSidebar {...defaultProps} isExpanded={true} />)
      expect(screen.getByLabelText('Créer une nouvelle session')).toBeInTheDocument()
    })

    it('renders "Nouvelle session" text when expanded', () => {
      render(<DesktopSidebar {...defaultProps} isExpanded={true} />)
      expect(screen.getByText('Nouvelle session')).toBeInTheDocument()
    })

    it('renders "Nouveau" text when collapsed', () => {
      render(<DesktopSidebar {...defaultProps} isExpanded={false} />)
      expect(screen.getByText('Nouveau')).toBeInTheDocument()
    })

    it('calls onOpenCreateSessionModal when clicked', async () => {
      const user = userEvent.setup()
      const onOpenCreateSessionModal = vi.fn()
      render(
        <DesktopSidebar {...defaultProps} onOpenCreateSessionModal={onOpenCreateSessionModal} />
      )
      await user.click(screen.getByLabelText('Créer une nouvelle session'))
      expect(onOpenCreateSessionModal).toHaveBeenCalledTimes(1)
    })
  })

  // =========================================================================
  // Pin button
  // =========================================================================
  describe('pin button', () => {
    it('shows pin button when expanded', () => {
      render(<DesktopSidebar {...defaultProps} isExpanded={true} />)
      expect(screen.getByLabelText(/pingler la sidebar|tacher la sidebar/i)).toBeInTheDocument()
    })

    it('shows "Épingler la sidebar" label when not pinned', () => {
      render(<DesktopSidebar {...defaultProps} isExpanded={true} sidebarPinned={false} />)
      expect(screen.getByLabelText('Épingler la sidebar')).toBeInTheDocument()
    })

    it('shows "Détacher la sidebar" label when pinned', () => {
      render(<DesktopSidebar {...defaultProps} isExpanded={true} sidebarPinned={true} />)
      expect(screen.getByLabelText('Détacher la sidebar')).toBeInTheDocument()
    })

    it('calls onTogglePinned when pin button clicked', async () => {
      const user = userEvent.setup()
      const onTogglePinned = vi.fn()
      render(<DesktopSidebar {...defaultProps} isExpanded={true} onTogglePinned={onTogglePinned} />)
      await user.click(screen.getByLabelText('Épingler la sidebar'))
      expect(onTogglePinned).toHaveBeenCalledTimes(1)
    })

    it('does not show pin button when collapsed', () => {
      render(<DesktopSidebar {...defaultProps} isExpanded={false} />)
      expect(screen.queryByLabelText('Épingler la sidebar')).not.toBeInTheDocument()
    })
  })

  // =========================================================================
  // Mouse events
  // =========================================================================
  describe('mouse events', () => {
    it('calls onMouseEnter when mouse enters sidebar', () => {
      const onMouseEnter = vi.fn()
      render(<DesktopSidebar {...defaultProps} onMouseEnter={onMouseEnter} />)
      fireEvent.mouseEnter(screen.getByLabelText('Navigation principale'))
      expect(onMouseEnter).toHaveBeenCalledTimes(1)
    })

    it('calls onMouseLeave when mouse leaves sidebar', () => {
      const onMouseLeave = vi.fn()
      render(<DesktopSidebar {...defaultProps} onMouseLeave={onMouseLeave} />)
      fireEvent.mouseLeave(screen.getByLabelText('Navigation principale'))
      expect(onMouseLeave).toHaveBeenCalledTimes(1)
    })
  })

  // =========================================================================
  // Tour data attributes
  // =========================================================================
  describe('tour data attributes', () => {
    it('sets data-tour="squads" on squads nav item', () => {
      const { container } = render(<DesktopSidebar {...defaultProps} />)
      expect(container.querySelector('[data-tour="squads"]')).toBeInTheDocument()
    })

    it('sets data-tour="messages" on messages nav item', () => {
      const { container } = render(<DesktopSidebar {...defaultProps} />)
      expect(container.querySelector('[data-tour="messages"]')).toBeInTheDocument()
    })

    it('sets data-tour="party" on party nav item', () => {
      const { container } = render(<DesktopSidebar {...defaultProps} />)
      expect(container.querySelector('[data-tour="party"]')).toBeInTheDocument()
    })

    it('sets data-tour="sessions" on home nav item', () => {
      const { container } = render(<DesktopSidebar {...defaultProps} />)
      expect(container.querySelector('[data-tour="sessions"]')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Expanded vs Collapsed layout
  // =========================================================================
  describe('expanded vs collapsed', () => {
    it('renders expanded layout with full labels', () => {
      render(<DesktopSidebar {...defaultProps} isExpanded={true} />)
      expect(screen.getByText('Squad Planner')).toBeInTheDocument()
      expect(screen.getByText('Nouvelle session')).toBeInTheDocument()
    })

    it('renders collapsed layout with short labels', () => {
      render(<DesktopSidebar {...defaultProps} isExpanded={false} />)
      expect(screen.queryByText('Squad Planner')).not.toBeInTheDocument()
      expect(screen.getByText('Nouveau')).toBeInTheDocument()
    })
  })
})

// =========================================================================
// NavLink component (exported, tested separately)
// =========================================================================
describe('NavLink', () => {
  it('renders with correct label and path', () => {
    render(
      <NavLink
        path="/test"
        icon={(props: any) => createElement('span', props)}
        label="Test Link"
        isActive={false}
      />
    )
    expect(screen.getByLabelText('Test Link')).toBeInTheDocument()
    expect(screen.getByLabelText('Test Link').closest('a')).toHaveAttribute('href', '/test')
  })

  it('sets aria-current=page when active', () => {
    render(
      <NavLink
        path="/test"
        icon={(props: any) => createElement('span', props)}
        label="Test Link"
        isActive={true}
      />
    )
    expect(screen.getByLabelText('Test Link').closest('a')).toHaveAttribute('aria-current', 'page')
  })

  it('does not set aria-current when not active', () => {
    render(
      <NavLink
        path="/test"
        icon={(props: any) => createElement('span', props)}
        label="Test Link"
        isActive={false}
      />
    )
    expect(screen.getByLabelText('Test Link').closest('a')).not.toHaveAttribute('aria-current')
  })

  it('renders badge when provided', () => {
    render(
      <NavLink
        path="/test"
        icon={(props: any) => createElement('span', props)}
        label="Test"
        isActive={false}
        badge={7}
      />
    )
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('does not render badge element when badge is undefined', () => {
    render(
      <NavLink
        path="/test"
        icon={(props: any) => createElement('span', props)}
        label="Test"
        isActive={false}
        badge={undefined}
      />
    )
    // No badge span should be rendered
    expect(screen.queryByText('9+')).not.toBeInTheDocument()
  })
})

// =========================================================================
// navItems export
// =========================================================================
describe('navItems', () => {
  it('exports 7 navigation items', () => {
    expect(navItems).toHaveLength(7)
  })

  it('includes all expected paths', () => {
    const paths = navItems.map((i) => i.path)
    expect(paths).toContain('/home')
    expect(paths).toContain('/squads')
    expect(paths).toContain('/sessions')
    expect(paths).toContain('/party')
    expect(paths).toContain('/messages')
    expect(paths).toContain('/discover')
    expect(paths).toContain('/profile')
  })
})
