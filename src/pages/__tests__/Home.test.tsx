import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Hoisted mocks (required for vi.mock factory access) ──
const { mockNavigate, mockMutateAsync, mockHaptic, mockOpenCreateSession } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockMutateAsync: vi.fn().mockResolvedValue({}),
  mockHaptic: { medium: vi.fn(), success: vi.fn(), error: vi.fn() },
  mockOpenCreateSession: vi.fn(),
}))

// ── Mock react-router ──
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/home', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(mockNavigate),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

// ── Mock framer-motion ──
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

// ── Mock supabase ──
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// ── Configurable auth store mock ──
const defaultAuthState = {
  user: { id: 'user-1', user_metadata: { username: 'TestUser' } },
  profile: {
    id: 'user-1',
    username: 'TestUser',
    reliability_score: 85,
    total_sessions: 10,
    created_at: '2025-01-01T00:00:00Z',
  },
  isLoading: false,
  isInitialized: true,
}
let mockAuthState = { ...defaultAuthState }

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => mockAuthState),
    { getState: vi.fn(() => mockAuthState) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => mockAuthState),
    { getState: vi.fn(() => mockAuthState) }
  ),
  useConfetti: vi.fn(() => ({ active: false, fire: vi.fn(), cancel: vi.fn() })),
}))

// ── Mock toast ──
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))

// ── Mock i18n ──
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))

// ── Mock voice chat ──
let mockVoiceChatState = { isConnected: false, currentChannel: null, remoteUsers: [] as any[] }
vi.mock('../../hooks/useVoiceChat', () => ({
  useVoiceChatStore: Object.assign(
    vi.fn(() => mockVoiceChatState),
    {
      getState: vi.fn(() => mockVoiceChatState),
      subscribe: vi.fn().mockReturnValue(() => {}),
    }
  ),
}))

// ── Configurable query hooks ──
let mockSquadsReturn = { data: undefined as any[] | undefined, isLoading: false }
let mockSessionsReturn = { data: undefined as any[] | undefined, isLoading: false }
let mockFriendsReturn = { data: [] as any[], isLoading: false }
let mockAICoachReturn = { data: null as any, isLoading: false }

vi.mock('../../hooks/queries/useSquadsQuery', () => ({
  useSquadsQuery: vi.fn(() => mockSquadsReturn),
}))

vi.mock('../../hooks/queries/useSessionsQuery', () => ({
  useUpcomingSessionsQuery: vi.fn(() => mockSessionsReturn),
  useRsvpMutation: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
}))

vi.mock('../../hooks/queries/useFriendsPlaying', () => ({
  useFriendsPlayingQuery: vi.fn(() => mockFriendsReturn),
}))

vi.mock('../../hooks/queries/useAICoach', () => ({
  useAICoachQueryDeferred: vi.fn(() => mockAICoachReturn),
}))

// ── Mock CreateSessionModal ──
vi.mock('../../components/CreateSessionModal', () => ({
  useCreateSessionModal: vi.fn(() => mockOpenCreateSession),
}))

// ── Mock simple components ──
vi.mock('../../components/OnboardingChecklist', () => ({
  OnboardingChecklist: (props: any) =>
    createElement('div', { 'data-testid': 'onboarding-checklist', 'data-has-squad': props.hasSquad, 'data-has-session': props.hasSession }),
}))

vi.mock('../../components/LazyConfetti', () => ({
  default: () => createElement('div', { 'data-testid': 'confetti' }),
}))

vi.mock('../../components/PullToRefresh', () => ({
  PullToRefresh: ({ children }: any) => createElement('div', null, children),
}))

vi.mock('../../components/ui', () => ({
  Tooltip: ({ children }: any) => createElement('div', null, children),
  CrossfadeTransition: ({ children, skeleton, isLoading }: any) =>
    isLoading ? skeleton : children,
  SkeletonHomePage: () => createElement('div', { 'data-testid': 'skeleton-home' }),
}))

vi.mock('../../components/icons', () => ({
  TrendingUp: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-trending' }),
  Loader2: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-loader' }),
  AlertCircle: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-alert' }),
  Star: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-star' }),
}))

// ── Home sections: capture props to verify data flow ──
let capturedStatsProps: any = null
let capturedSessionsProps: any = null
let capturedFriendsProps: any = null
let capturedSquadsProps: any = null
let capturedPartyProps: any = null
let capturedAICoachProps: any = null
let capturedActivityFeedProps: any = null

vi.mock('../../components/home', () => ({
  HomeStatsSection: (props: any) => {
    capturedStatsProps = props
    return createElement('div', { 'data-testid': 'home-stats', 'data-squads': props.squadsCount, 'data-sessions-week': props.sessionsThisWeek })
  },
  HomeSessionsSection: (props: any) => {
    capturedSessionsProps = props
    return createElement('div', { 'data-testid': 'home-sessions', 'data-count': props.upcomingSessions?.length ?? 0 })
  },
  HomeFriendsSection: (props: any) => {
    capturedFriendsProps = props
    return createElement('div', { 'data-testid': 'home-friends' })
  },
  HomeAICoachSection: (props: any) => {
    capturedAICoachProps = props
    return createElement('div', { 'data-testid': 'home-ai-coach' })
  },
  HomeSquadsSection: (props: any) => {
    capturedSquadsProps = props
    return createElement('div', { 'data-testid': 'home-squads' })
  },
  HomePartySection: (props: any) => {
    capturedPartyProps = props
    return createElement('div', { 'data-testid': 'home-party' })
  },
  HomeActivityFeed: (props: any) => {
    capturedActivityFeedProps = props
    return createElement('div', { 'data-testid': 'home-activity' })
  },
}))

// ── Mock haptics ──
vi.mock('../../utils/haptics', () => ({
  haptic: mockHaptic,
}))

// ── Helpers ──
function makeSquad(overrides: Partial<any> = {}) {
  return {
    id: 's1',
    name: 'Alpha Squad',
    game: 'Valorant',
    invite_code: 'ABC123',
    owner_id: 'user-1',
    total_members: 4,
    member_count: 4,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeSession(overrides: Partial<any> = {}) {
  const now = new Date()
  return {
    id: 'ses-1',
    title: 'Ranked game',
    game: 'Valorant',
    scheduled_at: new Date(now.getTime() + 86400000).toISOString(), // tomorrow
    status: 'scheduled',
    squad_id: 's1',
    rsvp_counts: { present: 2, absent: 0, maybe: 1 },
    my_rsvp: null,
    ...overrides,
  }
}

import Home from '../Home'

describe('Home Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockAuthState = { ...defaultAuthState }
    mockSquadsReturn = { data: undefined, isLoading: false }
    mockSessionsReturn = { data: undefined, isLoading: false }
    mockFriendsReturn = { data: [], isLoading: false }
    mockAICoachReturn = { data: null, isLoading: false }
    mockVoiceChatState = { isConnected: false, currentChannel: null, remoteUsers: [] }
    capturedStatsProps = null
    capturedSessionsProps = null
    capturedFriendsProps = null
    capturedSquadsProps = null
    capturedPartyProps = null
    capturedAICoachProps = null
    capturedActivityFeedProps = null
    mockNavigate.mockClear()
    mockMutateAsync.mockClear()
    mockHaptic.medium.mockClear()
    mockHaptic.success.mockClear()
    mockHaptic.error.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderHome = (props: any = {}) => {
    return render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(Home, props)
      )
    )
  }

  // ══════════════════════════════════════════════════
  // DATA FLOW: Fallback logic (THE dashboard bug test)
  // ══════════════════════════════════════════════════

  describe('data fallback logic', () => {
    it('uses loaderSquads when query returns undefined', () => {
      const squad = makeSquad()
      mockSquadsReturn = { data: undefined, isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [squad], upcomingSessions: [] },
      })

      // HomeStatsSection should receive squadsCount=1 from loader fallback
      expect(capturedStatsProps.squadsCount).toBe(1)
    })

    it('uses loaderSquads when query returns empty array (race condition)', () => {
      const squad = makeSquad()
      mockSquadsReturn = { data: [], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [squad], upcomingSessions: [] },
      })

      // BUG DETECTION: querySquads is [], so fallback to loaderSquads which has 1 squad
      expect(capturedStatsProps.squadsCount).toBe(1)
    })

    it('uses query data when query returns non-empty array', () => {
      const loaderSquad = makeSquad({ id: 's-loader', name: 'Loader Squad' })
      const querySquad = makeSquad({ id: 's-query', name: 'Query Squad' })
      mockSquadsReturn = { data: [querySquad], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [loaderSquad], upcomingSessions: [] },
      })

      expect(capturedStatsProps.squadsCount).toBe(1)
      // Verify the correct squad is passed (query > loader)
      expect(capturedSquadsProps.squads[0].name).toBe('Query Squad')
    })

    it('handles loaderData.squads being undefined gracefully', () => {
      mockSquadsReturn = { data: undefined, isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: undefined, upcomingSessions: [] },
      })

      expect(capturedStatsProps.squadsCount).toBe(0)
    })

    it('handles loaderData.squads being non-array gracefully', () => {
      mockSquadsReturn = { data: undefined, isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: 'not-array' as any, upcomingSessions: [] },
      })

      expect(capturedStatsProps.squadsCount).toBe(0)
    })

    it('uses loaderSessions when query returns undefined', () => {
      const session = makeSession()
      const squad = makeSquad()
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: undefined, isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [squad], upcomingSessions: [session] },
      })

      expect(capturedSessionsProps.upcomingSessions.length).toBe(1)
    })

    it('uses loaderSessions when query returns empty (session race condition)', () => {
      const session = makeSession()
      const squad = makeSquad()
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [squad], upcomingSessions: [session] },
      })

      expect(capturedSessionsProps.upcomingSessions.length).toBe(1)
    })

    it('uses query sessions when query returns non-empty', () => {
      const loaderSession = makeSession({ id: 'ses-loader', title: 'Loader Session' })
      const querySession = makeSession({ id: 'ses-query', title: 'Query Session' })
      const squad = makeSquad()
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [querySession], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [squad], upcomingSessions: [loaderSession] },
      })

      expect(capturedSessionsProps.upcomingSessions[0].title).toBe('Query Session')
    })

    it('returns empty upcomingSessions when squads is empty (no squad name resolution)', () => {
      const session = makeSession()
      mockSquadsReturn = { data: undefined, isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      // rawSessions has data but squads is empty → upcomingSessions should be empty
      expect(capturedSessionsProps.upcomingSessions.length).toBe(0)
    })
  })

  // ══════════════════════════════════════════════
  // SESSIONS THIS WEEK calculation
  // ══════════════════════════════════════════════

  describe('sessionsThisWeek calculation', () => {
    it('returns 0 when no sessions', () => {
      mockSquadsReturn = { data: [makeSquad()], isLoading: false }
      mockSessionsReturn = { data: [], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedStatsProps.sessionsThisWeek).toBe(0)
    })

    it('counts sessions scheduled within current week', () => {
      const squad = makeSquad()
      const now = new Date()
      // Create session for today (definitely this week)
      const todaySession = makeSession({
        id: 'today',
        scheduled_at: now.toISOString(),
      })
      // Create session for next month (definitely NOT this week)
      const farSession = makeSession({
        id: 'far',
        scheduled_at: new Date(now.getTime() + 30 * 86400000).toISOString(),
      })

      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [todaySession, farSession], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedStatsProps.sessionsThisWeek).toBe(1)
    })
  })

  // ══════════════════════════════════════════════
  // UPCOMING SESSIONS filtering and mapping
  // ══════════════════════════════════════════════

  describe('upcomingSessions processing', () => {
    it('filters out cancelled sessions', () => {
      const squad = makeSquad()
      const active = makeSession({ id: 'active', status: 'scheduled' })
      const cancelled = makeSession({ id: 'cancelled', status: 'cancelled' })
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [active, cancelled], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedSessionsProps.upcomingSessions.length).toBe(1)
      expect(capturedSessionsProps.upcomingSessions[0].id).toBe('active')
    })

    it('limits to 5 sessions max', () => {
      const squad = makeSquad()
      const sessions = Array.from({ length: 8 }, (_, i) =>
        makeSession({ id: `ses-${i}`, title: `Session ${i}` })
      )
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: sessions, isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedSessionsProps.upcomingSessions.length).toBe(5)
    })

    it('resolves squad name from squads array', () => {
      const squad = makeSquad({ id: 's1', name: 'My Cool Squad' })
      const session = makeSession({ squad_id: 's1' })
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedSessionsProps.upcomingSessions[0].squad_name).toBe('My Cool Squad')
    })

    it('falls back to "Squad" when squad not found', () => {
      const squad = makeSquad({ id: 's1' })
      const session = makeSession({ squad_id: 'unknown-squad' })
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedSessionsProps.upcomingSessions[0].squad_name).toBe('Squad')
    })

    it('resolves total_members from squad member_count', () => {
      const squad = makeSquad({ id: 's1', member_count: 7 })
      const session = makeSession({ squad_id: 's1' })
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedSessionsProps.upcomingSessions[0].total_members).toBe(7)
    })

    it('falls back total_members to total_members then 1', () => {
      const squad = makeSquad({ id: 's1', member_count: undefined, total_members: 5 })
      const session = makeSession({ squad_id: 's1' })
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedSessionsProps.upcomingSessions[0].total_members).toBe(5)
    })

    it('defaults rsvp_counts when missing', () => {
      const squad = makeSquad()
      const session = makeSession({ rsvp_counts: undefined })
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedSessionsProps.upcomingSessions[0].rsvp_counts).toEqual({
        present: 0,
        absent: 0,
        maybe: 0,
      })
    })
  })

  // ══════════════════════════════════════════════
  // LOADING STATES
  // ══════════════════════════════════════════════

  describe('loading states', () => {
    it('shows skeleton when squads AND sessions are loading without server data', () => {
      mockAuthState = { ...defaultAuthState, isInitialized: true }
      mockSquadsReturn = { data: undefined, isLoading: true }
      mockSessionsReturn = { data: undefined, isLoading: true }

      renderHome({})

      expect(screen.getByTestId('skeleton-home')).toBeDefined()
    })

    it('does not show skeleton when server data is present (SSR)', () => {
      mockSquadsReturn = { data: undefined, isLoading: true }
      mockSessionsReturn = { data: undefined, isLoading: true }

      renderHome({
        loaderData: {
          profile: defaultAuthState.profile,
          squads: [],
          upcomingSessions: [],
        },
      })

      expect(screen.queryByTestId('skeleton-home')).toBeNull()
    })

    it('shows spinner when not initialized and no user', () => {
      mockAuthState = {
        ...defaultAuthState,
        user: null as any,
        profile: null as any,
        isInitialized: false,
      }

      renderHome({})

      expect(screen.getByTestId('icon-loader')).toBeDefined()
    })

    it('redirects to / when initialized but no user', () => {
      mockAuthState = {
        ...defaultAuthState,
        user: null as any,
        profile: null as any,
        isInitialized: true,
      }

      renderHome({})

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('passes loading states to HomeStatsSection', () => {
      mockSquadsReturn = { data: undefined, isLoading: true }
      mockSessionsReturn = { data: undefined, isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedStatsProps.squadsLoading).toBe(true)
    })

    it('derives sessionsLoading from both session query and squads loading', () => {
      mockSquadsReturn = { data: undefined, isLoading: true }
      mockSessionsReturn = { data: undefined, isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      // sessionsLoading = sessionsQueryLoading || (squadsLoading && !squads.length)
      // = false || (true && true) = true
      expect(capturedStatsProps.sessionsLoading).toBe(true)
    })

    it('sessionsLoading is false when squads exist even if squads still loading', () => {
      const squad = makeSquad()
      mockSquadsReturn = { data: [squad], isLoading: true }
      mockSessionsReturn = { data: undefined, isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [squad], upcomingSessions: [] },
      })

      // sessionsLoading = false || (true && !1) = false || false = false
      // squads.length > 0 because querySquads has data
      expect(capturedStatsProps.sessionsLoading).toBe(false)
    })
  })

  // ══════════════════════════════════════════════
  // GREETING & DISPLAY
  // ══════════════════════════════════════════════

  describe('greeting and display', () => {
    it('shows username in greeting', () => {
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(screen.getByText(/TestUser/)).toBeDefined()
    })

    it('truncates long usernames at 15 chars', () => {
      mockAuthState = {
        ...defaultAuthState,
        profile: { ...defaultAuthState.profile, username: 'VeryLongUsername123456' },
      }

      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, username: 'VeryLongUsername123456' },
          squads: [],
          upcomingSessions: [],
        },
      })

      expect(screen.getByText(/VeryLongUsernam\u2026/)).toBeDefined()
    })

    it('shows "Ta squad t\'attend" when no upcoming sessions', () => {
      mockSquadsReturn = { data: [], isLoading: false }
      mockSessionsReturn = { data: [], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(screen.getByText(/Ta squad t'attend/)).toBeDefined()
    })

    it('shows pending RSVP count when sessions have no response', () => {
      const squad = makeSquad()
      const session1 = makeSession({ id: 's1', my_rsvp: null })
      const session2 = makeSession({ id: 's2', my_rsvp: 'present' })
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session1, session2], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(screen.getByText(/1 session attend ta réponse/)).toBeDefined()
    })

    it('shows plural form for multiple pending RSVPs', () => {
      const squad = makeSquad()
      const session1 = makeSession({ id: 's1', my_rsvp: null })
      const session2 = makeSession({ id: 's2', my_rsvp: null })
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session1, session2], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(screen.getByText(/2 sessions attendent ta réponse/)).toBeDefined()
    })

    it('shows all confirmed message when all RSVPs done', () => {
      const squad = makeSquad()
      const session = makeSession({ my_rsvp: 'present' })
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(screen.getByText(/toutes tes sessions sont confirmées/)).toBeDefined()
    })
  })

  // ══════════════════════════════════════════════
  // RELIABILITY BADGE
  // ══════════════════════════════════════════════

  describe('reliability badge', () => {
    it('shows score with Star icon for >= 95%', () => {
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, reliability_score: 98, total_sessions: 10 },
          squads: [],
          upcomingSessions: [],
        },
      })

      expect(screen.getByText('98% fiable')).toBeDefined()
      expect(screen.getByTestId('icon-star')).toBeDefined()
    })

    it('shows score with TrendingUp for 80-94%', () => {
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, reliability_score: 85, total_sessions: 10 },
          squads: [],
          upcomingSessions: [],
        },
      })

      expect(screen.getByText('85% fiable')).toBeDefined()
    })

    it('shows warning color for 60-79%', () => {
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, reliability_score: 65, total_sessions: 10 },
          squads: [],
          upcomingSessions: [],
        },
      })

      expect(screen.getByText('65%')).toBeDefined()
    })

    it('shows error color for < 60%', () => {
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, reliability_score: 40, total_sessions: 10 },
          squads: [],
          upcomingSessions: [],
        },
      })

      expect(screen.getByText('40%')).toBeDefined()
      expect(screen.getByTestId('icon-alert')).toBeDefined()
    })

    it('shows 0% for new players with 0 sessions (regardless of DB score)', () => {
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, reliability_score: 100, total_sessions: 0 },
          squads: [],
          upcomingSessions: [],
        },
      })

      // New player with 0 sessions → score forced to 0
      expect(screen.getByText('0%')).toBeDefined()
    })
  })

  // ══════════════════════════════════════════════
  // ONBOARDING CHECKLIST
  // ══════════════════════════════════════════════

  describe('onboarding checklist', () => {
    it('shows onboarding for new users (< 7 days) with no squads', () => {
      const recentDate = new Date(Date.now() - 2 * 86400000).toISOString() // 2 days ago
      mockSquadsReturn = { data: [], isLoading: false }
      mockSessionsReturn = { data: [], isLoading: false }

      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, created_at: recentDate },
          squads: [],
          upcomingSessions: [],
        },
      })

      expect(screen.getByTestId('onboarding-checklist')).toBeDefined()
    })

    it('hides onboarding for users older than 7 days', () => {
      const oldDate = new Date(Date.now() - 30 * 86400000).toISOString() // 30 days ago
      mockSquadsReturn = { data: [], isLoading: false }
      mockSessionsReturn = { data: [], isLoading: false }

      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, created_at: oldDate },
          squads: [],
          upcomingSessions: [],
        },
      })

      expect(screen.queryByTestId('onboarding-checklist')).toBeNull()
    })

    it('hides onboarding when user has squads AND sessions', () => {
      const recentDate = new Date(Date.now() - 1 * 86400000).toISOString()
      const squad = makeSquad()
      const session = makeSession()
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, created_at: recentDate },
          squads: [],
          upcomingSessions: [],
        },
      })

      expect(screen.queryByTestId('onboarding-checklist')).toBeNull()
    })
  })

  // ══════════════════════════════════════════════
  // RSVP HANDLING
  // ══════════════════════════════════════════════

  describe('RSVP handling', () => {
    it('calls haptic.medium on RSVP attempt', async () => {
      const squad = makeSquad()
      const session = makeSession()
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      // Verify the onRsvp handler is passed
      expect(capturedSessionsProps.onRsvp).toBeDefined()

      // Call the RSVP handler directly
      await act(async () => {
        await capturedSessionsProps.onRsvp('ses-1', 'present')
      })

      expect(mockHaptic.medium).toHaveBeenCalled()
      expect(mockMutateAsync).toHaveBeenCalledWith({ sessionId: 'ses-1', response: 'present' })
    })

    it('shows confetti and success message on present RSVP', async () => {
      const squad = makeSquad()
      const session = makeSession()
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      await act(async () => {
        await capturedSessionsProps.onRsvp('ses-1', 'present')
      })

      expect(mockHaptic.success).toHaveBeenCalled()
      expect(screen.getByText("T'es confirmé ! Ta squad compte sur toi")).toBeDefined()
    })

    it('shows "Absence enregistrée" on absent RSVP', async () => {
      const squad = makeSquad()
      const session = makeSession()
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      await act(async () => {
        await capturedSessionsProps.onRsvp('ses-1', 'absent')
      })

      expect(screen.getByText('Absence enregistrée')).toBeDefined()
    })

    it('shows "Réponse enregistrée" on maybe RSVP', async () => {
      const squad = makeSquad()
      const session = makeSession()
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      await act(async () => {
        await capturedSessionsProps.onRsvp('ses-1', 'maybe')
      })

      expect(screen.getByText('Réponse enregistrée')).toBeDefined()
    })

    it('shows error message on RSVP failure', async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error('Network error'))
      const squad = makeSquad()
      const session = makeSession()
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockSessionsReturn = { data: [session], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      await act(async () => {
        await capturedSessionsProps.onRsvp('ses-1', 'present')
      })

      expect(mockHaptic.error).toHaveBeenCalled()
      expect(screen.getByText(/Erreur/)).toBeDefined()
    })
  })

  // ══════════════════════════════════════════════
  // VOICE CHAT / ACTIVE PARTY
  // ══════════════════════════════════════════════

  describe('active party', () => {
    it('passes activeParty=null when not in voice chat', () => {
      mockVoiceChatState = { isConnected: false, currentChannel: null, remoteUsers: [] }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedPartyProps.activeParty).toBeNull()
    })

    it('passes activeParty with squad name when connected with remote users', () => {
      const squad = makeSquad({ id: 's1', name: 'My Squad' })
      mockSquadsReturn = { data: [squad], isLoading: false }
      mockVoiceChatState = {
        isConnected: true,
        currentChannel: 'party-s1-channel',
        remoteUsers: [{ id: 'u2' }, { id: 'u3' }],
      }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedPartyProps.activeParty).toEqual({
        squadName: 'My Squad',
        participantCount: 3, // 2 remote + self
      })
    })

    it('activeParty is null when connected but no remote users', () => {
      mockVoiceChatState = {
        isConnected: true,
        currentChannel: 'party-s1',
        remoteUsers: [],
      }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedPartyProps.activeParty).toBeNull()
    })
  })

  // ══════════════════════════════════════════════
  // PROPS PASSED TO CHILD COMPONENTS
  // ══════════════════════════════════════════════

  describe('child component props', () => {
    it('passes correct squadsCount and sessionsThisWeek to HomeStatsSection', () => {
      const squad1 = makeSquad({ id: 's1' })
      const squad2 = makeSquad({ id: 's2' })
      mockSquadsReturn = { data: [squad1, squad2], isLoading: false }
      mockSessionsReturn = { data: [], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedStatsProps.squadsCount).toBe(2)
      expect(capturedStatsProps.sessionsThisWeek).toBe(0)
    })

    it('passes squadIds to HomeActivityFeed', () => {
      const squad1 = makeSquad({ id: 'sq-abc' })
      const squad2 = makeSquad({ id: 'sq-def' })
      mockSquadsReturn = { data: [squad1, squad2], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedActivityFeedProps.squadIds).toEqual(['sq-abc', 'sq-def'])
    })

    it('passes friendsPlaying data to HomeFriendsSection', () => {
      const friends = [{ id: 'f1', username: 'Friend1', squad_id: 's1' }]
      mockFriendsReturn = { data: friends, isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedFriendsProps.friendsPlaying).toEqual(friends)
    })

    it('passes party CTA when no sessions but has squads and no active party', () => {
      mockSquadsReturn = { data: [makeSquad()], isLoading: false }
      mockSessionsReturn = { data: [], isLoading: false }
      mockVoiceChatState = { isConnected: false, currentChannel: null, remoteUsers: [] }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedPartyProps.showCTA).toBe(true)
    })

    it('hides party CTA when no squads', () => {
      mockSquadsReturn = { data: [], isLoading: false }
      mockSessionsReturn = { data: [], isLoading: false }

      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      expect(capturedPartyProps.showCTA).toBe(false)
    })
  })

  // ══════════════════════════════════════════════
  // PROFILE FALLBACK
  // ══════════════════════════════════════════════

  describe('profile fallback', () => {
    it('uses loaderData.profile over authProfile', () => {
      const loaderProfile = { ...defaultAuthState.profile, username: 'LoaderUser' }

      renderHome({
        loaderData: { profile: loaderProfile, squads: [], upcomingSessions: [] },
      })

      expect(screen.getByText(/LoaderUser/)).toBeDefined()
    })

    it('falls back to authProfile when loaderData has no profile', () => {
      renderHome({
        loaderData: { profile: null, squads: [], upcomingSessions: [] },
      })

      // authProfile has username 'TestUser'
      expect(screen.getByText(/TestUser/)).toBeDefined()
    })
  })

  // ══════════════════════════════════════════════
  // NAVIGATION HANDLERS
  // ══════════════════════════════════════════════

  describe('navigation handlers', () => {
    it('passes handleJoinFriendParty that navigates to party page', () => {
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      act(() => {
        capturedFriendsProps.onJoin('squad-123')
      })

      expect(mockNavigate).toHaveBeenCalledWith('/party?squad=squad-123')
    })

    it('passes handleInviteFriend that navigates to messages', () => {
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })

      act(() => {
        capturedFriendsProps.onInvite('friend-456')
      })

      expect(mockNavigate).toHaveBeenCalledWith('/messages?dm=friend-456')
    })
  })
})
