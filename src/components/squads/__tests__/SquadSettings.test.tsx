import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { SquadSettings } from '../SquadSettings'

const mockNavigate = vi.fn()

// Mock react-router
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {},
  domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn(), on: vi.fn() }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn() }),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

// Mock icons
vi.mock('../../icons', () => ({
  Trash2: (props: any) => createElement('svg', { 'data-testid': 'icon-trash', ...props }),
  LogOut: (props: any) => createElement('svg', { 'data-testid': 'icon-logout', ...props }),
  ChevronRight: (props: any) => createElement('svg', { 'data-testid': 'icon-chevron', ...props }),
  UserPlus: (props: any) => createElement('svg', { 'data-testid': 'icon-userplus', ...props }),
  Calendar: (props: any) => createElement('svg', { 'data-testid': 'icon-calendar', ...props }),
  MessageCircle: (props: any) => createElement('svg', { 'data-testid': 'icon-message', ...props }),
  Settings: (props: any) => createElement('svg', { 'data-testid': 'icon-settings', ...props }),
  BarChart3: (props: any) => createElement('svg', { 'data-testid': 'icon-chart', ...props }),
  Download: (props: any) => createElement('svg', { 'data-testid': 'icon-download', ...props }),
  Zap: (props: any) => createElement('svg', { 'data-testid': 'icon-zap', ...props }),
  Trophy: (props: any) => createElement('svg', { 'data-testid': 'icon-trophy', ...props }),
  Loader2: (props: any) => createElement('svg', { 'data-testid': 'icon-loader', ...props }),
}))

// Mock UI components
vi.mock('../../ui', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, ...props }: any) =>
    createElement('button', { onClick, disabled, className, ...props }, children),
  Card: ({ children, className }: any) =>
    createElement('div', { className, 'data-testid': 'card' }, children),
  Drawer: ({ children, isOpen, onClose, title }: any) =>
    isOpen
      ? createElement('div', { 'data-testid': 'drawer' }, [
          createElement('h3', { key: 'title' }, title),
          children,
        ])
      : null,
}))

// Mock PremiumGate
vi.mock('../../PremiumGate', () => ({
  PremiumGate: ({ children, feature, fallback }: any) =>
    createElement('div', { 'data-testid': `premium-gate-${feature}` }, children),
  PremiumBadge: ({ small }: any) =>
    createElement('span', { 'data-testid': 'premium-badge' }, 'Premium'),
}))

// Mock SquadLeaderboard - capture props for verification
const mockLeaderboardProps = vi.hoisted(() => ({ entries: [] as any[], currentUserId: '' }))
vi.mock('../../SquadLeaderboard', () => ({
  SquadLeaderboard: ({ entries, currentUserId }: any) => {
    mockLeaderboardProps.entries = entries
    mockLeaderboardProps.currentUserId = currentUserId
    return createElement(
      'div',
      { 'data-testid': 'squad-leaderboard' },
      `Leaderboard: ${entries.length} entries`
    )
  },
}))

// Mock calendarExport
const mockExportFn = vi.hoisted(() => vi.fn())
vi.mock('../../../utils/calendarExport', () => ({
  exportSessionsToICS: mockExportFn,
}))

const defaultProps = {
  squadId: 'squad-1',
  squadName: 'Test Squad',
  isOwner: true,
  sessionsCount: 12,
  memberCount: 4,
  avgReliability: 85.7,
  canAccessAdvancedStats: true,
  leaderboard: [
    { user_id: 'user-1', username: 'Player1', total_present: 10, reliability: 90 },
    { user_id: 'user-2', username: 'Player2', total_present: 8, reliability: 80 },
  ],
  leaderboardLoading: false,
  currentUserId: 'user-1',
  isSquadPremium: false,
  sessions: [
    { id: 's1', title: 'Session 1', scheduled_at: new Date().toISOString(), status: 'confirmed' },
  ],
  onLeaveSquad: vi.fn(),
  onDeleteSquad: vi.fn(),
  onInviteClick: vi.fn(),
  onCreateSessionClick: vi.fn(),
  onEditSquadClick: vi.fn(),
  showActionsDrawer: false,
  onOpenActionsDrawer: vi.fn(),
  onCloseActionsDrawer: vi.fn(),
  onSuccess: vi.fn(),
}

describe('SquadSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // === STATS SECTION ===

  it('renders stats section heading', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByText('Heatmaps et tendances')).toBeInTheDocument()
  })

  it('displays stats values', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('rounds avgReliability to nearest integer', () => {
    render(<SquadSettings {...defaultProps} avgReliability={85.7} />)
    expect(screen.getByText('86%')).toBeInTheDocument()
  })

  it('rounds avgReliability with .3 down', () => {
    render(<SquadSettings {...defaultProps} avgReliability={42.3} />)
    expect(screen.getByText('42%')).toBeInTheDocument()
  })

  it('shows stat labels', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getByText('Membres')).toBeInTheDocument()
    expect(screen.getByText('Fiabilité')).toBeInTheDocument()
  })

  // === PREMIUM GATES ===

  it('wraps stats in premium gate for advanced_stats', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByTestId('premium-gate-advanced_stats')).toBeInTheDocument()
  })

  it('wraps export in premium gate for calendar_export', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByTestId('premium-gate-calendar_export')).toBeInTheDocument()
  })

  it('shows PremiumBadge when canAccessAdvancedStats is false', () => {
    render(<SquadSettings {...defaultProps} canAccessAdvancedStats={false} />)
    const badges = screen.getAllByTestId('premium-badge')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  // === CALENDAR EXPORT ===

  it('shows export button', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByText('Exporter')).toBeInTheDocument()
  })

  it('calls exportSessionsToICS on export click and shows success', () => {
    render(<SquadSettings {...defaultProps} />)
    fireEvent.click(screen.getByText('Exporter'))
    expect(mockExportFn).toHaveBeenCalledWith(defaultProps.sessions, defaultProps.squadName)
    expect(defaultProps.onSuccess).toHaveBeenCalledWith(
      'Calendrier exporté ! Importe le fichier .ics dans ton app calendrier.'
    )
  })

  it('shows error message when export throws', () => {
    mockExportFn.mockImplementation(() => {
      throw new Error('Export failed')
    })
    render(<SquadSettings {...defaultProps} />)
    fireEvent.click(screen.getByText('Exporter'))
    expect(defaultProps.onSuccess).toHaveBeenCalledWith('Export failed')
  })

  it('shows generic error when export throws non-Error', () => {
    mockExportFn.mockImplementation(() => {
      throw 'oops'
    })
    render(<SquadSettings {...defaultProps} />)
    fireEvent.click(screen.getByText('Exporter'))
    expect(defaultProps.onSuccess).toHaveBeenCalledWith("Erreur lors de l'export")
  })

  // === SQUAD PREMIUM SECTION ===

  it('shows Squad Premium section when isSquadPremium is true', () => {
    render(<SquadSettings {...defaultProps} isSquadPremium={true} />)
    expect(screen.getByText('Squad Premium')).toBeInTheDocument()
    expect(
      screen.getByText('Audio HD, heatmaps de présence, export calendrier actifs')
    ).toBeInTheDocument()
  })

  it('hides Squad Premium section when isSquadPremium is false', () => {
    render(<SquadSettings {...defaultProps} isSquadPremium={false} />)
    expect(screen.queryByText('Squad Premium')).not.toBeInTheDocument()
  })

  // === LEADERBOARD ===

  it('renders leaderboard when entries exist', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByTestId('squad-leaderboard')).toBeInTheDocument()
    expect(screen.getByText('Classement')).toBeInTheDocument()
  })

  it('hides leaderboard when no entries', () => {
    render(<SquadSettings {...defaultProps} leaderboard={[]} />)
    expect(screen.queryByTestId('squad-leaderboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Classement')).not.toBeInTheDocument()
  })

  it('transforms leaderboard data: rank, xp, level, reliability_score', () => {
    render(
      <SquadSettings
        {...defaultProps}
        leaderboard={[{ user_id: 'u1', username: 'A', total_present: 10, reliability: 90 }]}
      />
    )
    // Check the transformed props passed to SquadLeaderboard
    expect(mockLeaderboardProps.entries.length).toBe(1)
    expect(mockLeaderboardProps.entries[0].xp).toBe(100) // 10 * 10
    expect(mockLeaderboardProps.entries[0].level).toBe(2) // Math.max(1, floor(100/100)+1)
    expect(mockLeaderboardProps.entries[0].reliability_score).toBe(90)
    expect(mockLeaderboardProps.entries[0].streak_days).toBe(0)
  })

  it('passes currentUserId to leaderboard', () => {
    render(<SquadSettings {...defaultProps} currentUserId="user-42" />)
    expect(mockLeaderboardProps.currentUserId).toBe('user-42')
  })

  it('sorts leaderboard by XP descending', () => {
    render(
      <SquadSettings
        {...defaultProps}
        leaderboard={[
          { user_id: 'u1', username: 'Low', total_present: 2 },
          { user_id: 'u2', username: 'High', total_present: 10 },
        ]}
      />
    )
    expect(mockLeaderboardProps.entries[0].username).toBe('High')
    expect(mockLeaderboardProps.entries[1].username).toBe('Low')
  })

  it('uses xp from entry if provided', () => {
    render(
      <SquadSettings
        {...defaultProps}
        leaderboard={[{ user_id: 'u1', username: 'A', xp: 500, total_present: 1 }]}
      />
    )
    expect(mockLeaderboardProps.entries[0].xp).toBe(500)
  })

  it('handles null leaderboard gracefully', () => {
    render(<SquadSettings {...defaultProps} leaderboard={null as any} />)
    expect(screen.queryByTestId('squad-leaderboard')).not.toBeInTheDocument()
  })

  it('shows loading spinner when leaderboardLoading is true', () => {
    render(<SquadSettings {...defaultProps} leaderboardLoading={true} />)
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument()
  })

  // === OWNER VS NON-OWNER ACTIONS ===

  it('shows delete button for owner on desktop', () => {
    render(<SquadSettings {...defaultProps} isOwner={true} />)
    expect(screen.getByText('Supprimer la squad')).toBeInTheDocument()
  })

  it('shows leave button for non-owner on desktop', () => {
    render(<SquadSettings {...defaultProps} isOwner={false} />)
    expect(screen.getByText('Quitter la squad')).toBeInTheDocument()
  })

  it('calls onDeleteSquad when delete button clicked', () => {
    render(<SquadSettings {...defaultProps} isOwner={true} />)
    fireEvent.click(screen.getByText('Supprimer la squad'))
    expect(defaultProps.onDeleteSquad).toHaveBeenCalled()
  })

  it('calls onLeaveSquad when leave button clicked', () => {
    render(<SquadSettings {...defaultProps} isOwner={false} />)
    fireEvent.click(screen.getByText('Quitter la squad'))
    expect(defaultProps.onLeaveSquad).toHaveBeenCalled()
  })

  // === MOBILE DRAWER ===

  it('opens mobile actions drawer on button click', () => {
    render(<SquadSettings {...defaultProps} />)
    fireEvent.click(screen.getByText('Actions de la squad'))
    expect(defaultProps.onOpenActionsDrawer).toHaveBeenCalled()
  })

  it('renders drawer when showActionsDrawer is true', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={true} />)
    expect(screen.getByTestId('drawer')).toBeInTheDocument()
    expect(screen.getByText('Inviter des joueurs')).toBeInTheDocument()
    expect(screen.getByText('Créer une session')).toBeInTheDocument()
    expect(screen.getByText('Chat de la squad')).toBeInTheDocument()
  })

  it('does not render drawer when showActionsDrawer is false', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={false} />)
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument()
  })

  it('drawer invite button calls onInviteClick and closes drawer', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={true} />)
    fireEvent.click(screen.getByText('Inviter des joueurs'))
    expect(defaultProps.onInviteClick).toHaveBeenCalled()
    expect(defaultProps.onCloseActionsDrawer).toHaveBeenCalled()
  })

  it('drawer create session button calls onCreateSessionClick and closes drawer', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={true} />)
    fireEvent.click(screen.getByText('Créer une session'))
    expect(defaultProps.onCreateSessionClick).toHaveBeenCalled()
    expect(defaultProps.onCloseActionsDrawer).toHaveBeenCalled()
  })

  it('drawer chat button navigates and closes drawer', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={true} />)
    fireEvent.click(screen.getByText('Chat de la squad'))
    expect(mockNavigate).toHaveBeenCalledWith('/messages?squad=squad-1')
    expect(defaultProps.onCloseActionsDrawer).toHaveBeenCalled()
  })

  it('shows edit squad option in drawer for owner with onEditSquadClick', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={true} isOwner={true} />)
    expect(screen.getByText('Modifier la squad')).toBeInTheDocument()
  })

  it('hides edit squad option in drawer for non-owner', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={true} isOwner={false} />)
    expect(screen.queryByText('Modifier la squad')).not.toBeInTheDocument()
  })

  it('hides edit squad option in drawer when onEditSquadClick is not provided', () => {
    render(
      <SquadSettings
        {...defaultProps}
        showActionsDrawer={true}
        isOwner={true}
        onEditSquadClick={undefined}
      />
    )
    expect(screen.queryByText('Modifier la squad')).not.toBeInTheDocument()
  })

  it('drawer edit squad calls onEditSquadClick and closes drawer', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={true} isOwner={true} />)
    fireEvent.click(screen.getByText('Modifier la squad'))
    expect(defaultProps.onEditSquadClick).toHaveBeenCalled()
    expect(defaultProps.onCloseActionsDrawer).toHaveBeenCalled()
  })

  it('drawer shows delete for owner and calls both callbacks', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={true} isOwner={true} />)
    // There are two "Supprimer la squad" texts: desktop and drawer.
    const deleteButtons = screen.getAllByText('Supprimer la squad')
    // Click the one in the drawer (second one)
    fireEvent.click(deleteButtons[deleteButtons.length - 1])
    expect(defaultProps.onDeleteSquad).toHaveBeenCalled()
    expect(defaultProps.onCloseActionsDrawer).toHaveBeenCalled()
  })

  it('drawer shows leave for non-owner and calls both callbacks', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={true} isOwner={false} />)
    const leaveButtons = screen.getAllByText('Quitter la squad')
    fireEvent.click(leaveButtons[leaveButtons.length - 1])
    expect(defaultProps.onLeaveSquad).toHaveBeenCalled()
    expect(defaultProps.onCloseActionsDrawer).toHaveBeenCalled()
  })
})
