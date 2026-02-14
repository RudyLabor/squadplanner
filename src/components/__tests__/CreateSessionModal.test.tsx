import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

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

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ data: [], error: null }) }) }), rpc: vi.fn().mockResolvedValue({ data: null, error: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ data: [], error: null }) }) }), rpc: vi.fn().mockResolvedValue({ data: null, error: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1', user_metadata: { username: 'TestUser' } }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1', user_metadata: { username: 'TestUser' } }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
  useSquadsStore: vi.fn().mockReturnValue({ squads: [{ id: 'sq-1', name: 'TestSquad', game: 'Valorant' }] }),
  useSessionsStore: vi.fn().mockReturnValue({ createSession: vi.fn().mockResolvedValue({ error: null }), isLoading: false }),
  useHapticFeedback: vi.fn().mockReturnValue({ triggerHaptic: vi.fn() }),
}))

vi.mock('../../hooks/useSquads', () => ({
  useSquadsStore: vi.fn().mockReturnValue({ squads: [{ id: 'sq-1', name: 'TestSquad', game: 'Valorant' }] }),
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }),
}))

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn(),
}))

vi.mock('../../utils/haptics', () => ({
  haptic: { light: vi.fn(), selection: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../lib/challengeTracker', () => ({
  trackChallengeProgress: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../ui', () => ({
  ResponsiveModal: ({ children, open, title }: any) => open ? createElement('div', { role: 'dialog' }, createElement('h2', null, title), children) : null,
  Select: ({ options, value, onChange, placeholder }: any) => createElement('select', { value, onChange: (e: any) => onChange(e.target.value) }, placeholder ? createElement('option', { value: '' }, placeholder) : null, options?.map((o: any) => createElement('option', { key: o.value, value: o.value }, o.label))),
  Button: ({ children, ...props }: any) => createElement('button', props, children),
  Skeleton: ({ className }: any) => createElement('div', { className }),
}))

import { CreateSessionModal, useCreateSessionModal } from '../CreateSessionModal'

describe('CreateSessionModal', () => {
  it('does not render when closed', () => {
    render(<CreateSessionModal />)
    expect(screen.queryByText('Nouvelle session')).not.toBeInTheDocument()
  })

  it('renders when opened via store', () => {
    useCreateSessionModal.getState().open()
    render(<CreateSessionModal />)
    expect(screen.getByText('Nouvelle session')).toBeInTheDocument()
    useCreateSessionModal.getState().close()
  })

  it('shows Annuler button when open', () => {
    useCreateSessionModal.getState().open()
    render(<CreateSessionModal />)
    expect(screen.getByText('Annuler')).toBeInTheDocument()
    useCreateSessionModal.getState().close()
  })

  it('useCreateSessionModal store works correctly', () => {
    const store = useCreateSessionModal.getState()
    expect(store.isOpen).toBe(false)
    store.open('sq-1')
    expect(useCreateSessionModal.getState().isOpen).toBe(true)
    expect(useCreateSessionModal.getState().preselectedSquadId).toBe('sq-1')
    store.close()
    expect(useCreateSessionModal.getState().isOpen).toBe(false)
  })
})
