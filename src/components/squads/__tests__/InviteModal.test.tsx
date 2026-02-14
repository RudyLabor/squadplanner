import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { InviteModal } from '../InviteModal'

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

// Mock supabase
vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}))

// Mock system messages
vi.mock('../../../lib/systemMessages', () => ({
  sendMemberJoinedMessage: vi.fn().mockResolvedValue(undefined),
}))

// Mock toast
vi.mock('../../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))

// Mock icons
vi.mock('../../icons', () => ({
  Copy: ({ children, ...props }: any) => createElement('svg', { 'data-testid': 'icon-copy', ...props }, children),
  Check: ({ children, ...props }: any) => createElement('svg', { 'data-testid': 'icon-check', ...props }, children),
  X: ({ children, ...props }: any) => createElement('svg', { 'data-testid': 'icon-x', ...props }, children),
  Search: ({ children, ...props }: any) => createElement('svg', { 'data-testid': 'icon-search', ...props }, children),
  Share2: ({ children, ...props }: any) => createElement('svg', { 'data-testid': 'icon-share2', ...props }, children),
  UserPlus: ({ children, ...props }: any) => createElement('svg', { 'data-testid': 'icon-userplus', ...props }, children),
  Loader2: ({ children, ...props }: any) => createElement('svg', { 'data-testid': 'icon-loader2', ...props }, children),
  Users: ({ children, ...props }: any) => createElement('svg', { 'data-testid': 'icon-users', ...props }, children),
}))

// Mock UI components
vi.mock('../../ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) =>
    createElement('button', { onClick, disabled, ...props }, children),
  Input: ({ onChange, onKeyDown, value, placeholder, className, ...props }: any) =>
    createElement('input', { onChange, onKeyDown, value, placeholder, className, ...props }),
}))

// Mock clipboard
const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, writable: true })

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  squadId: 'squad-1',
  squadName: 'Test Squad',
  inviteCode: 'ABC123',
  existingMemberIds: ['user-1'],
}

describe('InviteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing when open', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText('Inviter des joueurs')).toBeInTheDocument()
  })

  it('returns null when not open', () => {
    const { container } = render(<InviteModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('displays the invite code', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })

  it('displays the share URL', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText(/\/join\/ABC123/)).toBeInTheDocument()
  })

  it('has a close button', () => {
    render(<InviteModal {...defaultProps} />)
    const closeButton = screen.getByLabelText('Fermer')
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<InviteModal {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('displays search input for players', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByPlaceholderText("Nom d'utilisateur...")).toBeInTheDocument()
  })

  it('displays copy code button', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByLabelText("Copier le code d'invitation")).toBeInTheDocument()
  })

  it('displays share channels (WhatsApp, SMS, Discord, Plus)', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('SMS')).toBeInTheDocument()
    expect(screen.getByText('Discord')).toBeInTheDocument()
    expect(screen.getByText('Plus')).toBeInTheDocument()
  })

  it('shows search button', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText('Chercher')).toBeInTheDocument()
  })
})
