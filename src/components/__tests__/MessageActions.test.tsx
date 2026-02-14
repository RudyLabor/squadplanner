import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({ useLocation: vi.fn().mockReturnValue({ pathname: '/' }), useNavigate: vi.fn().mockReturnValue(vi.fn()), useParams: vi.fn().mockReturnValue({}), useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]), useLoaderData: vi.fn().mockReturnValue({}), Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children), NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children), Outlet: () => null, useMatches: vi.fn().mockReturnValue([]) }))
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
vi.mock('../../lib/supabaseMinimal', () => ({ supabaseMinimal: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ data: null }), update: vi.fn().mockResolvedValue({ data: null }), delete: vi.fn().mockResolvedValue({ data: null }), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() }), rpc: vi.fn().mockResolvedValue({ data: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() }, supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ data: null }), update: vi.fn().mockResolvedValue({ data: null }), delete: vi.fn().mockResolvedValue({ data: null }), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() }), rpc: vi.fn().mockResolvedValue({ data: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() }, isSupabaseReady: vi.fn().mockReturnValue(true) }))
vi.mock('../../hooks/useAuth', () => ({ useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1', user_metadata: { username: 'TestUser' } }, profile: { id: 'user-1', username: 'TestUser', avatar_url: null, reliability_score: 85 }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }) }))
vi.mock('../../hooks', () => ({ useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1', user_metadata: { username: 'TestUser' } }, profile: { id: 'user-1', username: 'TestUser', avatar_url: null }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }) }))
vi.mock('../../lib/i18n', () => ({ useT: () => (key: string) => key, useLocale: () => 'fr', useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }) }))
vi.mock('../../lib/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn() }))
vi.mock('../../utils/haptics', () => ({ haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() } }))

import { MessageActions } from '../MessageActions'

describe('MessageActions', () => {
  const defaultProps = {
    message: { id: 'msg-1', sender_id: 'user-1', content: 'Hello world' },
    currentUserId: 'user-1',
    isAdmin: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onPin: vi.fn(),
    onReply: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash', () => {
    render(<MessageActions {...defaultProps} />)
    expect(screen.getByLabelText('Actions du message')).toBeInTheDocument()
  })

  it('renders trigger button with correct aria attributes', () => {
    render(<MessageActions {...defaultProps} />)
    const btn = screen.getByLabelText('Actions du message')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(btn).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('opens menu when trigger is clicked', () => {
    render(<MessageActions {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('sets aria-expanded to true when menu is open', () => {
    render(<MessageActions {...defaultProps} />)
    const btn = screen.getByLabelText('Actions du message')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes menu when trigger is clicked again', () => {
    render(<MessageActions {...defaultProps} />)
    const btn = screen.getByLabelText('Actions du message')
    fireEvent.click(btn)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('always shows Reply option', () => {
    render(<MessageActions {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    expect(screen.getByText('Répondre')).toBeInTheDocument()
  })

  it('always shows Copy option', () => {
    render(<MessageActions {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    expect(screen.getByText('Copier le texte')).toBeInTheDocument()
  })

  it('calls onReply and closes menu when Reply is clicked', () => {
    const onReply = vi.fn()
    render(<MessageActions {...defaultProps} onReply={onReply} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    fireEvent.click(screen.getByText('Répondre'))
    expect(onReply).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows Edit and Delete for own messages', () => {
    render(<MessageActions {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    expect(screen.getByText('Modifier')).toBeInTheDocument()
    expect(screen.getByText('Supprimer')).toBeInTheDocument()
  })

  it('hides Edit and Delete for other users messages', () => {
    render(
      <MessageActions
        {...defaultProps}
        message={{ id: 'msg-1', sender_id: 'user-2', content: 'Hello' }}
      />
    )
    fireEvent.click(screen.getByLabelText('Actions du message'))
    expect(screen.queryByText('Modifier')).not.toBeInTheDocument()
    expect(screen.queryByText('Supprimer')).not.toBeInTheDocument()
  })

  it('calls onEdit and closes menu when Modifier is clicked', () => {
    const onEdit = vi.fn()
    render(<MessageActions {...defaultProps} onEdit={onEdit} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    fireEvent.click(screen.getByText('Modifier'))
    expect(onEdit).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows delete confirmation on first click of Supprimer', () => {
    render(<MessageActions {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    fireEvent.click(screen.getByText('Supprimer'))
    expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument()
  })

  it('calls onDelete on second click confirming deletion', () => {
    const onDelete = vi.fn()
    render(<MessageActions {...defaultProps} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    fireEvent.click(screen.getByText('Supprimer'))
    fireEvent.click(screen.getByText('Confirmer la suppression'))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('shows Pin for admins', () => {
    render(<MessageActions {...defaultProps} isAdmin={true} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    expect(screen.getByText('Épingler')).toBeInTheDocument()
  })

  it('hides Pin for non-admins', () => {
    render(<MessageActions {...defaultProps} isAdmin={false} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    expect(screen.queryByText('Épingler')).not.toBeInTheDocument()
  })

  it('calls onPin and closes menu when Pin is clicked', () => {
    const onPin = vi.fn()
    render(<MessageActions {...defaultProps} isAdmin={true} onPin={onPin} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    fireEvent.click(screen.getByText('Épingler'))
    expect(onPin).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows Forward when onForward is provided', () => {
    render(<MessageActions {...defaultProps} onForward={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    expect(screen.getByText('Transférer')).toBeInTheDocument()
  })

  it('hides Forward when onForward is not provided', () => {
    render(<MessageActions {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    expect(screen.queryByText('Transférer')).not.toBeInTheDocument()
  })

  it('calls onForward and closes menu when Forward is clicked', () => {
    const onForward = vi.fn()
    render(<MessageActions {...defaultProps} onForward={onForward} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    fireEvent.click(screen.getByText('Transférer'))
    expect(onForward).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows Thread when onThread is provided', () => {
    render(<MessageActions {...defaultProps} onThread={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    expect(screen.getByText('Ouvrir le thread')).toBeInTheDocument()
  })

  it('hides Thread when onThread is not provided', () => {
    render(<MessageActions {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    expect(screen.queryByText('Ouvrir le thread')).not.toBeInTheDocument()
  })

  it('calls onThread and closes menu when Thread is clicked', () => {
    const onThread = vi.fn()
    render(<MessageActions {...defaultProps} onThread={onThread} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    fireEvent.click(screen.getByText('Ouvrir le thread'))
    expect(onThread).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('renders all menu items as menuitems', () => {
    render(<MessageActions {...defaultProps} isAdmin={true} onForward={vi.fn()} onThread={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Actions du message'))
    const items = screen.getAllByRole('menuitem')
    expect(items.length).toBeGreaterThanOrEqual(6) // Reply, Thread, Copy, Forward, Pin, Edit, Delete
  })
})
