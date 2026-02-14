import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from '../Home'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/home', hash: '', search: '' }),
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
  supabaseMinimal: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1', user_metadata: { username: 'TestUser' } }, profile: { id: 'user-1', username: 'TestUser', reliability_score: 85, total_sessions: 10, created_at: new Date().toISOString() }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

// Mock hooks barrel
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1', user_metadata: { username: 'TestUser' } }, profile: { id: 'user-1', username: 'TestUser', reliability_score: 85, total_sessions: 10, created_at: new Date().toISOString() }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
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

// Mock voice chat hook (lazy loaded in Home.tsx)
vi.mock('../../hooks/useVoiceChat', () => ({
  useVoiceChatStore: Object.assign(
    vi.fn().mockReturnValue({ isConnected: false, currentChannel: null, remoteUsers: [] }),
    { getState: vi.fn().mockReturnValue({ isConnected: false, currentChannel: null, remoteUsers: [] }), subscribe: vi.fn().mockReturnValue(() => {}) }
  ),
}))

// Mock query hooks
vi.mock('../../hooks/queries/useSquadsQuery', () => ({
  useSquadsQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}))

vi.mock('../../hooks/queries/useSessionsQuery', () => ({
  useUpcomingSessionsQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useRsvpMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../../hooks/queries/useFriendsPlaying', () => ({
  useFriendsPlayingQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}))

vi.mock('../../hooks/queries/useAICoach', () => ({
  useAICoachQueryDeferred: vi.fn().mockReturnValue({ data: null, isLoading: false }),
}))

// Mock components
vi.mock('../../components/CreateSessionModal', () => ({
  useCreateSessionModal: vi.fn().mockReturnValue(vi.fn()),
}))

vi.mock('../../components/OnboardingChecklist', () => ({
  OnboardingChecklist: () => createElement('div', { 'data-testid': 'onboarding-checklist' }),
}))

vi.mock('../../components/LazyConfetti', () => ({
  default: () => null,
}))

vi.mock('../../components/PullToRefresh', () => ({
  PullToRefresh: ({ children }: any) => createElement('div', null, children),
}))

vi.mock('../../components/ui', () => ({
  Tooltip: ({ children }: any) => createElement('div', null, children),
  CrossfadeTransition: ({ children, skeleton, isLoading }: any) => isLoading ? skeleton : children,
  SkeletonHomePage: () => createElement('div', { 'data-testid': 'skeleton' }),
}))

vi.mock('../../components/icons', () => ({
  TrendingUp: (props: any) => createElement('span', props),
  Loader2: (props: any) => createElement('span', props),
  AlertCircle: (props: any) => createElement('span', props),
  Star: (props: any) => createElement('span', props),
}))

vi.mock('../../components/home', () => ({
  HomeStatsSection: () => createElement('div', { 'data-testid': 'home-stats' }),
  HomeSessionsSection: () => createElement('div', { 'data-testid': 'home-sessions' }),
  HomeFriendsSection: () => createElement('div', { 'data-testid': 'home-friends' }),
  HomeAICoachSection: () => createElement('div', { 'data-testid': 'home-ai-coach' }),
  HomeSquadsSection: () => createElement('div', { 'data-testid': 'home-squads' }),
  HomePartySection: () => createElement('div', { 'data-testid': 'home-party' }),
  HomeActivityFeed: () => createElement('div', { 'data-testid': 'home-activity' }),
}))

vi.mock('../../utils/haptics', () => ({
  haptic: { medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

describe('Home Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  const renderHome = (props = {}) => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Home, props)
      )
    )
  }

  it('renders without crash', () => {
    expect(() => renderHome()).not.toThrow()
  })

  it('renders with loader data', () => {
    expect(() => renderHome({
      loaderData: {
        profile: { id: 'user-1', username: 'TestUser', reliability_score: 85, total_sessions: 5 },
        squads: [{ id: 's1', name: 'Squad1', member_count: 3 }],
        upcomingSessions: [],
      },
    })).not.toThrow()
  })

  it('renders home sections', () => {
    renderHome({
      loaderData: {
        profile: { id: 'user-1', username: 'TestUser', reliability_score: 85, total_sessions: 5 },
        squads: [],
        upcomingSessions: [],
      },
    })
    expect(screen.getByTestId('home-stats')).toBeDefined()
    expect(screen.getByTestId('home-squads')).toBeDefined()
  })
})
