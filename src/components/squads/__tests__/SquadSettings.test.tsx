import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { SquadSettings } from '../SquadSettings'

// Mock react-router
vi.mock('react-router', () => ({
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
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
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
  motion: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
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
    isOpen ? createElement('div', { 'data-testid': 'drawer' }, [
      createElement('h3', { key: 'title' }, title),
      children,
    ]) : null,
}))

// Mock PremiumGate
vi.mock('../../PremiumGate', () => ({
  PremiumGate: ({ children, feature, fallback }: any) => createElement('div', { 'data-testid': `premium-gate-${feature}` }, children),
  PremiumBadge: ({ small }: any) => createElement('span', { 'data-testid': 'premium-badge' }, 'Premium'),
}))

// Mock SquadLeaderboard
vi.mock('../../SquadLeaderboard', () => ({
  SquadLeaderboard: ({ entries, currentUserId }: any) =>
    createElement('div', { 'data-testid': 'squad-leaderboard' }, `Leaderboard: ${entries.length} entries`),
}))

// Mock calendarExport
vi.mock('../../../utils/calendarExport', () => ({
  exportSessionsToICS: vi.fn(),
}))

const defaultProps = {
  squadId: 'squad-1',
  squadName: 'Test Squad',
  isOwner: true,
  sessionsCount: 12,
  memberCount: 4,
  avgReliability: 85,
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

  it('renders without crashing', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByText('Stats avancées')).toBeInTheDocument()
  })

  it('displays stats values', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByText('12')).toBeInTheDocument() // Sessions
    expect(screen.getByText('4')).toBeInTheDocument() // Members
    expect(screen.getByText('85%')).toBeInTheDocument() // Reliability
  })

  it('shows stat labels', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getByText('Membres')).toBeInTheDocument()
    expect(screen.getByText('Fiabilité')).toBeInTheDocument()
  })

  it('renders leaderboard when entries exist', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByTestId('squad-leaderboard')).toBeInTheDocument()
    expect(screen.getByText('Classement')).toBeInTheDocument()
  })

  it('shows delete button for owner', () => {
    render(<SquadSettings {...defaultProps} isOwner={true} />)
    expect(screen.getByText('Supprimer la squad')).toBeInTheDocument()
  })

  it('shows leave button for non-owner', () => {
    render(<SquadSettings {...defaultProps} isOwner={false} />)
    expect(screen.getByText('Quitter la squad')).toBeInTheDocument()
  })

  it('shows Squad Premium section when isSquadPremium is true', () => {
    render(<SquadSettings {...defaultProps} isSquadPremium={true} />)
    expect(screen.getByText('Squad Premium')).toBeInTheDocument()
  })

  it('does not show Squad Premium section when isSquadPremium is false', () => {
    render(<SquadSettings {...defaultProps} isSquadPremium={false} />)
    expect(screen.queryByText('Squad Premium')).not.toBeInTheDocument()
  })

  it('shows loading spinner when leaderboard is loading', () => {
    render(<SquadSettings {...defaultProps} leaderboardLoading={true} />)
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument()
  })

  it('opens mobile actions drawer on button click', () => {
    render(<SquadSettings {...defaultProps} />)
    const mobileActionsButton = screen.getByText('Actions de la squad')
    fireEvent.click(mobileActionsButton)
    expect(defaultProps.onOpenActionsDrawer).toHaveBeenCalled()
  })

  it('renders drawer when showActionsDrawer is true', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={true} />)
    expect(screen.getByTestId('drawer')).toBeInTheDocument()
    expect(screen.getByText('Inviter des joueurs')).toBeInTheDocument()
    expect(screen.getByText('Créer une session')).toBeInTheDocument()
    expect(screen.getByText('Chat de la squad')).toBeInTheDocument()
  })

  it('shows edit squad option in drawer for owner', () => {
    render(<SquadSettings {...defaultProps} showActionsDrawer={true} isOwner={true} />)
    expect(screen.getByText('Modifier la squad')).toBeInTheDocument()
  })

  it('has premium gate for advanced stats', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByTestId('premium-gate-advanced_stats')).toBeInTheDocument()
  })

  it('has premium gate for calendar export', () => {
    render(<SquadSettings {...defaultProps} />)
    expect(screen.getByTestId('premium-gate-calendar_export')).toBeInTheDocument()
  })
})
