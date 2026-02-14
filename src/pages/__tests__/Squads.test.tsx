import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Squads from '../Squads'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/squads', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
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

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn() },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
        }),
      }),
    }),
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
  usePremiumStore: Object.assign(
    vi.fn().mockReturnValue({ hasPremium: false, canCreateSquad: vi.fn().mockReturnValue(true), fetchPremiumStatus: vi.fn(), userSquadCount: 1 }),
    { getState: vi.fn().mockReturnValue({ hasPremium: false }) }
  ),
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn(),
}))

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }),
}))

// Mock voice chat
vi.mock('../../hooks/useVoiceChat', () => ({
  useVoiceChatStore: Object.assign(
    vi.fn().mockReturnValue({ isConnected: false, currentChannel: null, remoteUsers: [] }),
    { getState: vi.fn().mockReturnValue({ isConnected: false }), subscribe: vi.fn().mockReturnValue(() => {}) }
  ),
}))

// Mock query hooks
vi.mock('../../hooks/queries/useSquadsQuery', () => ({
  useSquadsQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreateSquadMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
  useJoinSquadMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
}))

// Mock premium
vi.mock('../../hooks/usePremium', () => ({
  FREE_SQUAD_LIMIT: 3,
  usePremiumStore: Object.assign(
    vi.fn().mockReturnValue({ hasPremium: false, canCreateSquad: vi.fn().mockReturnValue(true), fetchPremiumStatus: vi.fn(), userSquadCount: 1 }),
    { getState: vi.fn().mockReturnValue({ hasPremium: false }) }
  ),
}))

// Mock components
vi.mock('../../components/LazyConfetti', () => ({
  default: () => null,
}))

vi.mock('../../components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => createElement('button', { onClick, ...props }, children),
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  SquadCardSkeleton: () => createElement('div', { 'data-testid': 'skeleton' }),
}))

vi.mock('../../components/icons', () => ({
  Users: (props: any) => createElement('span', props),
  Plus: (props: any) => createElement('span', props),
  UserPlus: (props: any) => createElement('span', props),
  Compass: (props: any) => createElement('span', props),
}))

vi.mock('../../components/PremiumGate', () => ({
  SquadLimitReached: () => createElement('div', { 'data-testid': 'squad-limit' }),
  PremiumBadge: () => createElement('span', null, 'PRO'),
}))

vi.mock('../../components/PremiumUpgradeModal', () => ({
  PremiumUpgradeModal: () => null,
}))

vi.mock('../squads/SquadCard', () => ({
  SquadCard: ({ squad }: any) => createElement('div', { 'data-testid': `squad-${squad.id}` }, squad.name),
}))

vi.mock('../squads/SquadForms', () => ({
  JoinSquadForm: () => null,
  CreateSquadForm: () => null,
}))

describe('Squads Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  const renderSquads = (props = {}) => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Squads, props)
      )
    )
  }

  it('renders without crash', () => {
    expect(() => renderSquads()).not.toThrow()
  })

  it('renders empty state with no squads', () => {
    renderSquads()
    expect(screen.getByText(/Crée ta première squad/)).toBeDefined()
  })

  it('renders page title', () => {
    renderSquads()
    expect(screen.getByText('Mes Squads')).toBeDefined()
  })
})
