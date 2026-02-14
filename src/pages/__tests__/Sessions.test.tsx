import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sessions } from '../Sessions'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/sessions', hash: '', search: '' }),
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
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
  useAIStore: vi.fn().mockReturnValue({
    slotSuggestions: [],
    hasSlotHistory: false,
    coachTips: [],
    fetchSlotSuggestions: vi.fn(),
    fetchCoachTips: vi.fn(),
  }),
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

// Mock query hooks
vi.mock('../../hooks/queries/useSquadsQuery', () => ({
  useSquadsQuery: vi.fn().mockReturnValue({ data: [{ id: 'sq1', name: 'TestSquad' }], isLoading: false }),
}))

vi.mock('../../hooks/queries/useSessionsQuery', () => ({
  useUpcomingSessionsQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}))

// Mock CreateSessionModal
vi.mock('../../components/CreateSessionModal', () => ({
  useCreateSessionModal: vi.fn().mockReturnValue(vi.fn()),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  Plus: (props: any) => createElement('span', props),
  Loader2: (props: any) => createElement('span', props),
}))

// Mock components
vi.mock('../../components/LazyConfetti', () => ({
  default: () => null,
}))

vi.mock('../../components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => createElement('button', { onClick, ...props }, children),
}))

// Mock sub-components from pages/sessions
vi.mock('../sessions/NeedsResponseSection', () => ({
  NeedsResponseSection: () => createElement('div', { 'data-testid': 'needs-response' }),
  AllCaughtUp: () => createElement('div', { 'data-testid': 'all-caught-up' }),
}))

vi.mock('../sessions/AISuggestions', () => ({
  AISlotSuggestions: () => createElement('div', { 'data-testid': 'ai-suggestions' }),
  CoachTipsSection: () => createElement('div', { 'data-testid': 'coach-tips' }),
}))

vi.mock('../sessions/ConfirmedSessions', () => ({
  ConfirmedSessions: () => createElement('div', { 'data-testid': 'confirmed-sessions' }),
  HowItWorksSection: () => createElement('div', { 'data-testid': 'how-it-works' }),
}))

vi.mock('../sessions/WeekCalendar', () => ({
  WeekCalendar: () => createElement('div', { 'data-testid': 'week-calendar' }),
}))

describe('Sessions Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  const renderSessions = (props = {}) => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Sessions, props)
      )
    )
  }

  it('renders without crash', () => {
    expect(() => renderSessions()).not.toThrow()
  })

  it('renders page heading', () => {
    renderSessions()
    expect(screen.getByText('Tes prochaines sessions')).toBeDefined()
  })

  it('renders session sections', () => {
    renderSessions()
    expect(screen.getByTestId('week-calendar')).toBeDefined()
    expect(screen.getByTestId('confirmed-sessions')).toBeDefined()
  })
})
