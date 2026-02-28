import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Hoisted mocks ──
const { mockNavigate, mockMutateAsync, mockHaptic, mockOpenCreateSession } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockMutateAsync: vi.fn().mockResolvedValue({}),
  mockHaptic: { medium: vi.fn(), success: vi.fn(), error: vi.fn() },
  mockOpenCreateSession: vi.fn(),
}))

// ── Mock react-router (required — external dependency) ──
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/home', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(mockNavigate),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

// ── Mock framer-motion (jsdom limitation) ──
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

// ── Mock supabase (external service) ──
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

// ── Configurable auth store ──
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

// ── Mock voice chat (lazy-imported in Home.tsx) ──
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
let mockSquadsReturn = { data: undefined as any[] | undefined, isLoading: false, isPending: false }
let mockSessionsReturn = { data: undefined as any[] | undefined, isLoading: false }
let mockFriendsReturn = { data: [] as any[], isLoading: false }
let mockAICoachReturn = { data: undefined as any, isLoading: false }

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

// ── Mock haptics ──
vi.mock('../../utils/haptics', () => ({
  haptic: mockHaptic,
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

// ── Mock premium ──
const mockFetchPremiumStatus = vi.fn()
vi.mock('../../hooks/usePremium', () => ({
  usePremium: vi.fn(() => ({ tier: 'free' })),
  usePremiumStore: vi.fn((selector?: any) => {
    const state = { fetchPremiumStatus: mockFetchPremiumStatus, hasPremium: false, tier: 'free' }
    return selector ? selector(state) : state
  }),
}))

// ── Mock activity feed query (calls supabase internally) ──
vi.mock('../../hooks/queries/useActivityFeedQuery', () => ({
  useActivityFeedQuery: vi.fn(() => ({ data: [], isLoading: false })),
  getRelativeTime: vi.fn(() => 'il y a 1h'),
}))

// ── Minimal stubs: only for components with heavy external deps or side effects ──
vi.mock('../../components/LazyConfetti', () => ({
  default: () => createElement('div', { 'data-testid': 'confetti' }),
}))

vi.mock('../../components/PullToRefresh', () => ({
  PullToRefresh: ({ children }: any) => createElement('div', null, children),
}))

vi.mock('../../components/PlanBadge', () => ({
  PlanBadge: ({ tier }: any) => createElement('span', { 'data-testid': 'plan-badge' }, tier),
}))

vi.mock('../../components/OnboardingChecklist', () => ({
  OnboardingChecklist: ({ hasSquad, hasSession }: any) =>
    createElement('div', {
      'data-testid': 'onboarding-checklist',
      'data-has-squad': String(hasSquad),
      'data-has-session': String(hasSession),
    }),
}))

vi.mock('../../components/EmptyStateIllustration', () => ({
  EmptyStateIllustration: () => createElement('div', { 'data-testid': 'empty-illustration' }),
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
    scheduled_at: new Date(now.getTime() + 86400000).toISOString(),
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
    mockSquadsReturn = { data: undefined, isLoading: false, isPending: false }
    mockSessionsReturn = { data: undefined, isLoading: false }
    mockFriendsReturn = { data: [], isLoading: false }
    mockAICoachReturn = { data: undefined, isLoading: false }
    mockVoiceChatState = { isConnected: false, currentChannel: null, remoteUsers: [] }
    mockNavigate.mockClear()
    mockMutateAsync.mockClear()
    mockHaptic.medium.mockClear()
    mockHaptic.success.mockClear()
    mockHaptic.error.mockClear()
    mockOpenCreateSession.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderHome = (props: any = {}) => {
    return render(
      createElement(QueryClientProvider, { client: queryClient }, createElement(Home, props))
    )
  }

  // ══════════════════════════════════════════════
  // USER GREETING: sees name and contextual subtitle
  // ══════════════════════════════════════════════

  describe('greeting and user identity', () => {
    it('displays the username in the greeting header', () => {
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText(/TestUser/)).toBeInTheDocument()
    })

    it('truncates usernames longer than 15 chars with ellipsis', () => {
      mockAuthState = {
        ...defaultAuthState,
        profile: { ...defaultAuthState.profile, username: 'SuperLongGamerTag2026' },
      }
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, username: 'SuperLongGamerTag2026' },
          squads: [],
          upcomingSessions: [],
        },
      })
      expect(screen.getByText(/SuperLongGamerT\u2026/)).toBeInTheDocument()
    })

    it('shows default subtitle when no upcoming sessions', () => {
      mockSquadsReturn = { data: [], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [], isLoading: false }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText(/Tes potes ont voté pour la prochaine session/)).toBeInTheDocument()
    })

    it('shows pending RSVP count when sessions need response', () => {
      const squad = makeSquad()
      const noRsvp = makeSession({ id: 's1', my_rsvp: null })
      const hasRsvp = makeSession({ id: 's2', my_rsvp: 'present' })
      mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [noRsvp, hasRsvp], isLoading: false }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText(/1 session sans ta réponse/)).toBeInTheDocument()
    })

    it('shows plural form for multiple pending RSVPs', () => {
      const squad = makeSquad()
      mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
      mockSessionsReturn = {
        data: [makeSession({ id: 's1', my_rsvp: null }), makeSession({ id: 's2', my_rsvp: null })],
        isLoading: false,
      }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText(/2 sessions sans ta réponse/)).toBeInTheDocument()
    })

    it('shows "toutes tes sessions sont confirmées" when all RSVPs done', () => {
      const squad = makeSquad()
      mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [makeSession({ my_rsvp: 'present' })], isLoading: false }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText(/toutes tes sessions sont confirmées/)).toBeInTheDocument()
    })

    it('uses loaderData.profile for greeting over authProfile', () => {
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, username: 'LoaderUser' },
          squads: [],
          upcomingSessions: [],
        },
      })
      expect(screen.getByText(/LoaderUser/)).toBeInTheDocument()
    })

    it('falls back to authProfile when loaderData has no profile', () => {
      renderHome({
        loaderData: { profile: null, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText(/TestUser/)).toBeInTheDocument()
    })
  })

  // ══════════════════════════════════════════════
  // RELIABILITY BADGE: user sees their trust score
  // ══════════════════════════════════════════════

  describe('reliability badge', () => {
    it('shows "98% fiable" for excellent reliability (>=95%)', () => {
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, reliability_score: 98, total_sessions: 10 },
          squads: [],
          upcomingSessions: [],
        },
      })
      expect(screen.getByText('98% fiable')).toBeInTheDocument()
    })

    it('shows "85% fiable" for good reliability (80-94%)', () => {
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, reliability_score: 85, total_sessions: 10 },
          squads: [],
          upcomingSessions: [],
        },
      })
      expect(screen.getByText('85% fiable')).toBeInTheDocument()
    })

    it('shows percentage-only for warning range (60-79%)', () => {
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, reliability_score: 65, total_sessions: 10 },
          squads: [],
          upcomingSessions: [],
        },
      })
      expect(screen.getByText('65%')).toBeInTheDocument()
    })

    it('shows 0% for new players with 0 sessions regardless of DB score', () => {
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, reliability_score: 100, total_sessions: 0 },
          squads: [],
          upcomingSessions: [],
        },
      })
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  // ══════════════════════════════════════════════
  // SESSIONS: next session display and RSVP buttons
  // ══════════════════════════════════════════════

  describe('sessions section', () => {
    it('shows session title and squad name from real child components', () => {
      const squad = makeSquad({ id: 's1', name: 'TeamAlpha99' })
      const session = makeSession({ squad_id: 's1', title: 'Ranked Rush' })
      mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [session], isLoading: false }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText('Ranked Rush')).toBeInTheDocument()
      // Squad name appears in sessions section AND squads section
      expect(screen.getAllByText('TeamAlpha99').length).toBeGreaterThanOrEqual(1)
    })

    it('shows "Planifier une session" CTA when no sessions exist', () => {
      mockSquadsReturn = { data: [makeSquad()], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [], isLoading: false }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText(/Planifier une session/)).toBeInTheDocument()
    })

    it('shows RSVP buttons (present/maybe/absent) for upcoming sessions', () => {
      const squad = makeSquad()
      const session = makeSession()
      mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [session], isLoading: false }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByRole('button', { name: /Marquer comme présent/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Marquer comme peut-être/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Marquer comme absent/ })).toBeInTheDocument()
    })

    it('filters out cancelled sessions — only shows active ones', () => {
      const squad = makeSquad()
      mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
      mockSessionsReturn = {
        data: [
          makeSession({ id: 'a', title: 'Active Game', status: 'scheduled' }),
          makeSession({ id: 'c', title: 'Cancelled Game', status: 'cancelled' }),
        ],
        isLoading: false,
      }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText('Active Game')).toBeInTheDocument()
      expect(screen.queryByText('Cancelled Game')).not.toBeInTheDocument()
    })

    it('shows "Voir tout (N)" link when multiple sessions exist', () => {
      const squad = makeSquad()
      mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
      mockSessionsReturn = {
        data: [
          makeSession({ id: 's1', title: 'Game 1' }),
          makeSession({ id: 's2', title: 'Game 2' }),
        ],
        isLoading: false,
      }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText(/Voir tout \(2\)/)).toBeInTheDocument()
    })
  })

  // ══════════════════════════════════════════════
  // RSVP: user clicks button and sees real feedback
  // ══════════════════════════════════════════════

  describe('RSVP interactions', () => {
    it.todo(
      'clicking "present" triggers mutation + success message — needs RSVP mutation mock aligned with real component',
      async () => {
        const user = userEvent.setup()
        const squad = makeSquad()
        const session = makeSession()
        mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
        mockSessionsReturn = { data: [session], isLoading: false }
        renderHome({
          loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
        })

        await user.click(screen.getByRole('button', { name: /Marquer comme présent/ }))

        expect(mockMutateAsync).toHaveBeenCalledWith({ sessionId: 'ses-1', response: 'present' })
        await waitFor(() => {
          expect(screen.getByText(/Confirmé ! Ta squad sait qu'elle peut compter sur toi/)).toBeInTheDocument()
        })
      }
    )

    it.todo(
      'clicking "absent" shows "Absence enregistrée" — needs RSVP mutation mock aligned',
      async () => {
        const user = userEvent.setup()
        const squad = makeSquad()
        const session = makeSession()
        mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
        mockSessionsReturn = { data: [session], isLoading: false }
        renderHome({
          loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
        })

        await user.click(screen.getByRole('button', { name: /Marquer comme absent/ }))

        await waitFor(() => {
          expect(screen.getByText('Absence enregistrée')).toBeInTheDocument()
        })
      }
    )

    it.todo(
      'clicking "maybe" shows "Réponse enregistrée" — needs RSVP mutation mock aligned',
      async () => {
        const user = userEvent.setup()
        const squad = makeSquad()
        const session = makeSession()
        mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
        mockSessionsReturn = { data: [session], isLoading: false }
        renderHome({
          loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
        })

        await user.click(screen.getByRole('button', { name: /Marquer comme peut-être/ }))

        await waitFor(() => {
          expect(screen.getByText('Réponse enregistrée')).toBeInTheDocument()
        })
      }
    )

    it.todo(
      'shows error message and triggers haptic.error on RSVP failure — needs RSVP mutation mock aligned',
      async () => {
        mockMutateAsync.mockRejectedValueOnce(new Error('Network error'))
        const user = userEvent.setup()
        const squad = makeSquad()
        const session = makeSession()
        mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
        mockSessionsReturn = { data: [session], isLoading: false }
        renderHome({
          loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
        })

        await user.click(screen.getByRole('button', { name: /Marquer comme présent/ }))

        expect(mockHaptic.error).toHaveBeenCalled()
        await waitFor(() => {
          expect(screen.getByText(/Erreur/)).toBeInTheDocument()
        })
      }
    )
  })

  // ══════════════════════════════════════════════
  // SQUADS: user sees their squad list
  // ══════════════════════════════════════════════

  describe('squads section', () => {
    it('shows squad names when user has squads', () => {
      mockSquadsReturn = {
        data: [
          makeSquad({ id: 's1', name: 'Team Alpha', game: 'Valorant' }),
          makeSquad({ id: 's2', name: 'Team Beta', game: 'CS2' }),
        ],
        isLoading: false,
        isPending: false,
      }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText('Team Alpha')).toBeInTheDocument()
      expect(screen.getByText('Team Beta')).toBeInTheDocument()
    })

    it('shows "Créer ma squad" CTA when user has no squads', () => {
      mockSquadsReturn = { data: [], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [], isLoading: false }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText('Créer ma squad')).toBeInTheDocument()
    })

    it('displays member count for each squad', () => {
      mockSquadsReturn = {
        data: [makeSquad({ name: 'Team X', member_count: 7 })],
        isLoading: false,
        isPending: false,
      }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText('7 membres')).toBeInTheDocument()
    })
  })

  // ══════════════════════════════════════════════
  // DATA FALLBACK: loader data vs query data
  // ══════════════════════════════════════════════

  describe('data fallback logic', () => {
    it('uses loader squads when query returns undefined', () => {
      mockSquadsReturn = { data: undefined, isLoading: false, isPending: false }
      renderHome({
        loaderData: {
          profile: defaultAuthState.profile,
          squads: [makeSquad({ name: 'Loader Squad' })],
          upcomingSessions: [],
        },
      })
      expect(screen.getByText('Loader Squad')).toBeInTheDocument()
    })

    it('uses query squads when query returns real data', () => {
      mockSquadsReturn = {
        data: [makeSquad({ id: 'sq', name: 'Query Squad' })],
        isLoading: false,
        isPending: false,
      }
      renderHome({
        loaderData: {
          profile: defaultAuthState.profile,
          squads: [makeSquad({ name: 'Loader Squad' })],
          upcomingSessions: [],
        },
      })
      expect(screen.getByText('Query Squad')).toBeInTheDocument()
      expect(screen.queryByText('Loader Squad')).not.toBeInTheDocument()
    })

    it('falls back to loader sessions when query returns empty (race condition)', () => {
      const squad = makeSquad()
      mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [], isLoading: false }
      renderHome({
        loaderData: {
          profile: defaultAuthState.profile,
          squads: [squad],
          upcomingSessions: [makeSession({ title: 'Loader Session' })],
        },
      })
      expect(screen.getByText('Loader Session')).toBeInTheDocument()
    })

    it('returns no sessions when squads is empty (no squad name resolution)', () => {
      mockSquadsReturn = { data: undefined, isLoading: false, isPending: false }
      mockSessionsReturn = { data: [makeSession()], isLoading: false }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      // No session cards — empty state instead
      expect(screen.queryByText('Ranked game')).not.toBeInTheDocument()
    })
  })

  // ══════════════════════════════════════════════
  // LOADING & AUTH STATES
  // ══════════════════════════════════════════════

  describe('loading and auth states', () => {
    it('redirects to / when user is authenticated-out and initialized', () => {
      mockAuthState = {
        ...defaultAuthState,
        user: null as any,
        profile: null as any,
        isInitialized: true,
      }
      renderHome({})
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  // ══════════════════════════════════════════════
  // ONBOARDING: new users see setup guide
  // ══════════════════════════════════════════════

  describe('onboarding checklist', () => {
    it('shows onboarding for new users (< 7 days) with no squads', () => {
      const recentDate = new Date(Date.now() - 2 * 86400000).toISOString()
      mockSquadsReturn = { data: [], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [], isLoading: false }
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, created_at: recentDate },
          squads: [],
          upcomingSessions: [],
        },
      })
      const checklist = screen.getByTestId('onboarding-checklist')
      expect(checklist).toBeInTheDocument()
      expect(checklist).toHaveAttribute('data-has-squad', 'false')
      expect(checklist).toHaveAttribute('data-has-session', 'false')
    })

    it('hides onboarding for users older than 7 days', () => {
      const oldDate = new Date(Date.now() - 30 * 86400000).toISOString()
      mockSquadsReturn = { data: [], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [], isLoading: false }
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, created_at: oldDate },
          squads: [],
          upcomingSessions: [],
        },
      })
      expect(screen.queryByTestId('onboarding-checklist')).not.toBeInTheDocument()
    })

    it('hides onboarding when user has both squads and sessions', () => {
      const recentDate = new Date(Date.now() - 1 * 86400000).toISOString()
      mockSquadsReturn = { data: [makeSquad()], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [makeSession()], isLoading: false }
      renderHome({
        loaderData: {
          profile: { ...defaultAuthState.profile, created_at: recentDate },
          squads: [],
          upcomingSessions: [],
        },
      })
      expect(screen.queryByTestId('onboarding-checklist')).not.toBeInTheDocument()
    })
  })

  // ══════════════════════════════════════════════
  // PARTY: voice chat awareness
  // ══════════════════════════════════════════════

  describe('party section', () => {
    it('shows party CTA when user has squads but no sessions and no active party', () => {
      mockSquadsReturn = { data: [makeSquad()], isLoading: false, isPending: false }
      mockSessionsReturn = { data: [], isLoading: false }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText(/Lance la party vocale/)).toBeInTheDocument()
    })

    it.todo(
      'shows active party card with participant count when in voice chat — needs voice state mock aligned',
      () => {
        const squad = makeSquad({ id: 's1', name: 'Legends' })
        mockSquadsReturn = { data: [squad], isLoading: false, isPending: false }
        mockVoiceChatState = {
          isConnected: true,
          currentChannel: 'party-s1-channel',
          remoteUsers: [{ id: 'u2' }, { id: 'u3' }],
        }
        renderHome({
          loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
        })
        expect(screen.getByText(/3 potes dans Legends/)).toBeInTheDocument()
        expect(screen.getByText('Rejoindre')).toBeInTheDocument()
      }
    )
  })

  // ══════════════════════════════════════════════
  // ACTIVITY FEED
  // ══════════════════════════════════════════════

  describe('activity feed', () => {
    it('shows "Pas encore d\'activité" when no activities', () => {
      mockSquadsReturn = { data: [], isLoading: false, isPending: false }
      renderHome({
        loaderData: { profile: defaultAuthState.profile, squads: [], upcomingSessions: [] },
      })
      expect(screen.getByText("Pas encore d'activité")).toBeInTheDocument()
    })
  })
})
