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

const mockFetchSlotSuggestions = vi.fn()
const mockFetchCoachTips = vi.fn()

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
  useAIStore: vi.fn().mockReturnValue({
    slotSuggestions: [],
    hasSlotHistory: false,
    coachTips: [],
    fetchSlotSuggestions: mockFetchSlotSuggestions,
    fetchCoachTips: mockFetchCoachTips,
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
let mockSquadsReturn = { data: [{ id: 'sq1', name: 'TestSquad' }] as any[], isLoading: false }
let mockSessionsReturn = { data: [] as any[], isLoading: false }

vi.mock('../../hooks/queries/useSquadsQuery', () => ({
  useSquadsQuery: vi.fn(() => mockSquadsReturn),
}))

vi.mock('../../hooks/queries/useSessionsQuery', () => ({
  useUpcomingSessionsQuery: vi.fn(() => mockSessionsReturn),
}))

// Mock CreateSessionModal
const mockOpenCreateSession = vi.fn()
vi.mock('../../components/CreateSessionModal', () => ({
  useCreateSessionModal: vi.fn().mockReturnValue(mockOpenCreateSession),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  Plus: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-plus' }),
  Loader2: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-loader' }),
}))

// Mock components
vi.mock('../../components/LazyConfetti', () => ({
  default: () => null,
}))

vi.mock('../../components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => createElement('button', { onClick, ...props }, children),
}))

// Mock sub-components from pages/sessions — capture props
let capturedNeedsResponseProps: any = null
let capturedAllCaughtUpProps: any = null
let capturedAISuggestionsProps: any = null
let capturedCoachTipsProps: any = null
let capturedConfirmedProps: any = null
let capturedWeekCalendarProps: any = null

vi.mock('../sessions/NeedsResponseSection', () => ({
  NeedsResponseSection: (props: any) => { capturedNeedsResponseProps = props; return createElement('div', { 'data-testid': 'needs-response' }) },
  AllCaughtUp: (props: any) => { capturedAllCaughtUpProps = props; return createElement('div', { 'data-testid': 'all-caught-up' }) },
}))

vi.mock('../sessions/AISuggestions', () => ({
  AISlotSuggestions: (props: any) => { capturedAISuggestionsProps = props; return createElement('div', { 'data-testid': 'ai-suggestions' }) },
  CoachTipsSection: (props: any) => { capturedCoachTipsProps = props; return createElement('div', { 'data-testid': 'coach-tips' }) },
}))

vi.mock('../sessions/ConfirmedSessions', () => ({
  ConfirmedSessions: (props: any) => { capturedConfirmedProps = props; return createElement('div', { 'data-testid': 'confirmed-sessions' }) },
  HowItWorksSection: () => createElement('div', { 'data-testid': 'how-it-works' }),
}))

vi.mock('../sessions/WeekCalendar', () => ({
  WeekCalendar: (props: any) => { capturedWeekCalendarProps = props; return createElement('div', { 'data-testid': 'week-calendar' }) },
}))

describe('Sessions Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockSquadsReturn = { data: [{ id: 'sq1', name: 'TestSquad' }], isLoading: false }
    mockSessionsReturn = { data: [], isLoading: false }
    capturedNeedsResponseProps = null
    capturedAllCaughtUpProps = null
    capturedAISuggestionsProps = null
    capturedCoachTipsProps = null
    capturedConfirmedProps = null
    capturedWeekCalendarProps = null
    mockOpenCreateSession.mockClear()
  })

  const renderSessions = (props = {}) => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Sessions, props)
      )
    )
  }

  // STRICT: verifies the page structure — heading, subtitle, CTA button, aria landmark, all child sections render
  it('renders full page structure with heading, subtitle, create button, and all child sections', () => {
    renderSessions()

    // 1. Main heading present
    expect(screen.getByText('Tes prochaines sessions')).toBeDefined()
    // 2. Subtitle reflects zero sessions state
    expect(screen.getByText('Aucune session planifiée pour le moment')).toBeDefined()
    // 3. Create button present with icon
    expect(screen.getByText('Créer')).toBeDefined()
    expect(screen.getByTestId('icon-plus')).toBeDefined()
    // 4. aria landmark for main content
    expect(screen.getByRole('main', { name: 'Sessions' })).toBeDefined()
    // 5. All child sections render
    expect(screen.getByTestId('week-calendar')).toBeDefined()
    expect(screen.getByTestId('all-caught-up')).toBeDefined()
    expect(screen.getByTestId('needs-response')).toBeDefined()
    expect(screen.getByTestId('ai-suggestions')).toBeDefined()
    expect(screen.getByTestId('coach-tips')).toBeDefined()
    expect(screen.getByTestId('confirmed-sessions')).toBeDefined()
    expect(screen.getByTestId('how-it-works')).toBeDefined()
  })

  // STRICT: verifies data flow — sessions are filtered (future + non-cancelled), sorted by date, and split into needsResponse / confirmed
  it('filters, sorts, and dispatches sessions to correct child components', () => {
    const now = new Date()
    const futureSession = {
      id: 's1', title: 'Future', game: 'Val', scheduled_at: new Date(now.getTime() + 86400000).toISOString(),
      status: 'scheduled', my_rsvp: null, rsvp_counts: { present: 1 },
    }
    const confirmedSession = {
      id: 's2', title: 'Confirmed', game: 'LoL', scheduled_at: new Date(now.getTime() + 172800000).toISOString(),
      status: 'scheduled', my_rsvp: 'present', rsvp_counts: { present: 2 },
    }
    const cancelledSession = {
      id: 's3', title: 'Cancelled', game: 'CS', scheduled_at: new Date(now.getTime() + 86400000).toISOString(),
      status: 'cancelled', my_rsvp: null, rsvp_counts: { present: 0 },
    }
    const pastSession = {
      id: 's4', title: 'Past', game: 'Apex', scheduled_at: new Date(now.getTime() - 86400000).toISOString(),
      status: 'scheduled', my_rsvp: null, rsvp_counts: { present: 0 },
    }

    mockSessionsReturn = { data: [futureSession, confirmedSession, cancelledSession, pastSession], isLoading: false }

    renderSessions()

    // 1. NeedsResponse receives only future, non-cancelled sessions without RSVP
    expect(capturedNeedsResponseProps.needsResponse.length).toBe(1)
    expect(capturedNeedsResponseProps.needsResponse[0].id).toBe('s1')
    // 2. Confirmed receives only sessions with my_rsvp === 'present'
    expect(capturedConfirmedProps.confirmed.length).toBe(1)
    expect(capturedConfirmedProps.confirmed[0].id).toBe('s2')
    // 3. Cancelled and past sessions are excluded from both
    expect(capturedAllCaughtUpProps.needsResponse).toBe(1)
    expect(capturedAllCaughtUpProps.confirmed).toBe(1)
    // 4. WeekCalendar receives full upcoming (sorted) list
    expect(capturedWeekCalendarProps.sessions.length).toBe(2)
    // 5. Sessions are sorted by scheduled_at ascending (s1 before s2)
    expect(capturedWeekCalendarProps.sessions[0].id).toBe('s1')
    expect(capturedWeekCalendarProps.sessions[1].id).toBe('s2')
    // 6. Subtitle reflects 1 pending session
    expect(screen.getByText('1 session en attente de ta réponse')).toBeDefined()
  })

  // STRICT: verifies subtitle variations based on sessions state — pending plural, all confirmed, no sessions
  it('displays correct subtitle text for all session states', () => {
    const now = new Date()

    // Case 1: Multiple pending sessions
    const pending1 = { id: 'p1', title: 'P1', game: 'V', scheduled_at: new Date(now.getTime() + 86400000).toISOString(), status: 'scheduled', my_rsvp: null, rsvp_counts: { present: 0 } }
    const pending2 = { id: 'p2', title: 'P2', game: 'V', scheduled_at: new Date(now.getTime() + 172800000).toISOString(), status: 'scheduled', my_rsvp: null, rsvp_counts: { present: 0 } }
    mockSessionsReturn = { data: [pending1, pending2], isLoading: false }

    const { unmount: u1 } = renderSessions()
    // 1. Plural form for multiple pending
    expect(screen.getByText('2 sessions en attente de ta réponse')).toBeDefined()
    u1()

    // Case 2: All sessions confirmed
    const confirmed1 = { id: 'c1', title: 'C1', game: 'V', scheduled_at: new Date(now.getTime() + 86400000).toISOString(), status: 'scheduled', my_rsvp: 'present', rsvp_counts: { present: 1 } }
    mockSessionsReturn = { data: [confirmed1], isLoading: false }

    const { unmount: u2 } = renderSessions()
    // 2. Singular confirmed message
    expect(screen.getByText(/1 session confirmée/)).toBeDefined()
    // 3. Message includes encouragement
    expect(screen.getByText(/ta squad compte sur toi/)).toBeDefined()
    u2()

    // Case 3: Multiple confirmed sessions (plural)
    const confirmed2 = { id: 'c2', title: 'C2', game: 'L', scheduled_at: new Date(now.getTime() + 172800000).toISOString(), status: 'scheduled', my_rsvp: 'present', rsvp_counts: { present: 2 } }
    mockSessionsReturn = { data: [confirmed1, confirmed2], isLoading: false }

    const { unmount: u3 } = renderSessions()
    // 4. Plural confirmed form with 's' suffix
    expect(screen.getByText(/2 sessions confirmées/)).toBeDefined()
    u3()

    // Case 4: No sessions at all
    mockSessionsReturn = { data: [], isLoading: false }
    renderSessions()
    // 5. Empty state message
    expect(screen.getByText('Aucune session planifiée pour le moment')).toBeDefined()
    // 6. Confirmed sessions passes loading=false
    expect(capturedConfirmedProps.sessionsLoading).toBe(false)
  })
})
