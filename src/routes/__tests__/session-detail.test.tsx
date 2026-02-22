import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------
const mockGetUser = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())
const mockCreateMinimalSSRClient = vi.hoisted(() => vi.fn())
const mockData = vi.hoisted(() => vi.fn((d: any) => d))

// ---------------------------------------------------------------------------
// vi.mock declarations
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/session/1', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({ id: '1' }),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  redirect: vi.fn(),
  data: mockData,
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: ({ children }: any) => createElement('div', null, children || 'outlet'),
  useMatches: vi.fn().mockReturnValue([]),
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

vi.mock('../../lib/supabase-minimal-ssr', () => ({
  createMinimalSSRClient: mockCreateMinimalSSRClient,
}))

vi.mock('../../lib/queryClient', () => ({
  queryKeys: {
    sessions: { detail: (id: string) => ['sessions', 'detail', id] },
  },
}))

vi.mock('../../components/ClientRouteWrapper', () => ({
  ClientRouteWrapper: ({ children, seeds }: any) =>
    createElement(
      'div',
      { 'data-testid': 'route-wrapper', 'data-seeds': JSON.stringify(seeds) },
      children
    ),
}))

vi.mock('../../pages/SessionDetail', () => ({
  default: () => createElement('div', { 'data-testid': 'session-detail-page' }, 'SessionDetail'),
}))

import DefaultExport, { loader, meta, headers } from '../session-detail'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url = 'http://localhost/session/sess-123') {
  return new Request(url)
}

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function setupSSRMocks(overrides: {
  user?: any
  error?: any
  sessionData?: any
  rsvpsData?: any
  checkinsData?: any
  profilesData?: any
}) {
  const supabaseHeaders = new Headers()
  const fromFn = vi.fn()

  mockCreateMinimalSSRClient.mockReturnValue({
    supabase: {
      auth: { getUser: vi.fn() },
      from: fromFn,
    },
    headers: supabaseHeaders,
    getUser: mockGetUser.mockResolvedValue({
      data: { user: overrides.user ?? null },
      error: overrides.error ?? null,
    }),
  })

  fromFn.mockImplementation((table: string) => {
    if (table === 'sessions') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: overrides.sessionData ?? null }),
          }),
        }),
      }
    }
    if (table === 'session_rsvps') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: overrides.rsvpsData ?? null }),
        }),
      }
    }
    if (table === 'session_checkins') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: overrides.checkinsData ?? null }),
        }),
      }
    }
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: overrides.profilesData ?? null }),
        }),
      }
    }
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
  })

  return { supabaseHeaders, fromFn }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/session-detail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData.mockImplementation((d: any) => d)
  })

  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    it('returns correct title', () => {
      const result = meta()
      expect(result[0]).toEqual({ title: 'Détail Session - Squad Planner' })
    })

    it('returns canonical link to /sessions', () => {
      const result = meta()
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({
        tagName: 'link',
        rel: 'canonical',
        href: 'https://squadplanner.fr/sessions',
      })
    })

    it('returns og:url', () => {
      const result = meta()
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/sessions' })
    })
  })

  // =========================================================================
  // headers
  // =========================================================================
  describe('headers', () => {
    it('returns loaderHeaders as-is', () => {
      const loaderHeaders = new Headers({ 'X-Test': 'val' })
      const result = headers({ loaderHeaders })
      expect(result).toBe(loaderHeaders)
    })
  })

  // =========================================================================
  // loader
  // =========================================================================
  describe('loader', () => {
    it('returns null session when getUser returns error', async () => {
      setupSSRMocks({ error: new Error('no auth') })
      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-123' },
        context: {},
      } as any)
      expect(result).toEqual({ session: null, rsvps: [], checkins: [] })
    })

    it('returns null session when user is null', async () => {
      setupSSRMocks({ user: null })
      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-123' },
        context: {},
      } as any)
      expect(result).toEqual({ session: null, rsvps: [], checkins: [] })
    })

    it('fetches session, rsvps, and checkins in parallel', async () => {
      const sessionData = {
        id: 'sess-123',
        squad_id: 's1',
        title: 'Game Night',
        scheduled_at: '2026-02-20T18:00:00Z',
      }
      const rsvpsData = [
        { session_id: 'sess-123', user_id: 'u1', response: 'present' },
        { session_id: 'sess-123', user_id: 'u2', response: 'absent' },
      ]
      const checkinsData = [
        { session_id: 'sess-123', user_id: 'u1', checked_in_at: '2026-02-20T18:05:00Z' },
      ]
      const profilesData = [
        { id: 'u1', username: 'Alice' },
        { id: 'u2', username: 'Bob' },
      ]

      setupSSRMocks({ user: { id: 'u1' }, sessionData, rsvpsData, checkinsData, profilesData })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-123' },
        context: {},
      } as any)
      expect(result.session).toBeDefined()
      expect(result.session!.id).toBe('sess-123')
      expect(result.session!.rsvps).toHaveLength(2)
      expect(result.session!.checkins).toHaveLength(1)
    })

    it('returns null session when session is not found', async () => {
      setupSSRMocks({
        user: { id: 'u1' },
        sessionData: null,
        rsvpsData: [],
        checkinsData: [],
      })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'nonexistent' },
        context: {},
      } as any)
      expect(result.session).toBeNull()
    })

    it('computes RSVP counts correctly', async () => {
      const sessionData = {
        id: 'sess-1',
        squad_id: 's1',
        title: 'S',
        scheduled_at: '2026-02-20T18:00:00Z',
      }
      const rsvpsData = [
        { session_id: 'sess-1', user_id: 'u1', response: 'present' },
        { session_id: 'sess-1', user_id: 'u2', response: 'present' },
        { session_id: 'sess-1', user_id: 'u3', response: 'absent' },
        { session_id: 'sess-1', user_id: 'u4', response: 'maybe' },
        { session_id: 'sess-1', user_id: 'u5', response: 'maybe' },
      ]
      const profilesData = [
        { id: 'u1', username: 'A' },
        { id: 'u2', username: 'B' },
        { id: 'u3', username: 'C' },
        { id: 'u4', username: 'D' },
        { id: 'u5', username: 'E' },
      ]

      setupSSRMocks({ user: { id: 'u1' }, sessionData, rsvpsData, checkinsData: [], profilesData })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-1' },
        context: {},
      } as any)
      expect(result.session!.rsvp_counts).toEqual({ present: 2, absent: 1, maybe: 2 })
    })

    it('sets my_rsvp from current user RSVP', async () => {
      const sessionData = {
        id: 'sess-1',
        squad_id: 's1',
        title: 'S',
        scheduled_at: '2026-02-20T18:00:00Z',
      }
      const rsvpsData = [
        { session_id: 'sess-1', user_id: 'u1', response: 'maybe' },
        { session_id: 'sess-1', user_id: 'u2', response: 'present' },
      ]
      const profilesData = [
        { id: 'u1', username: 'A' },
        { id: 'u2', username: 'B' },
      ]

      setupSSRMocks({ user: { id: 'u1' }, sessionData, rsvpsData, checkinsData: [], profilesData })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-1' },
        context: {},
      } as any)
      expect(result.session!.my_rsvp).toBe('maybe')
    })

    it('sets my_rsvp to null when user has not responded', async () => {
      const sessionData = {
        id: 'sess-1',
        squad_id: 's1',
        title: 'S',
        scheduled_at: '2026-02-20T18:00:00Z',
      }
      const rsvpsData = [{ session_id: 'sess-1', user_id: 'other', response: 'present' }]
      const profilesData = [{ id: 'other', username: 'Other' }]

      setupSSRMocks({ user: { id: 'u1' }, sessionData, rsvpsData, checkinsData: [], profilesData })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-1' },
        context: {},
      } as any)
      expect(result.session!.my_rsvp).toBeNull()
    })

    it('attaches profile data to rsvps', async () => {
      const sessionData = {
        id: 'sess-1',
        squad_id: 's1',
        title: 'S',
        scheduled_at: '2026-02-20T18:00:00Z',
      }
      const rsvpsData = [
        { session_id: 'sess-1', user_id: 'u1', response: 'present' },
        { session_id: 'sess-1', user_id: 'u2', response: 'absent' },
      ]
      const profilesData = [
        { id: 'u1', username: 'Alice' },
        { id: 'u2', username: 'Bob' },
      ]

      setupSSRMocks({ user: { id: 'u1' }, sessionData, rsvpsData, checkinsData: [], profilesData })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-1' },
        context: {},
      } as any)
      expect(result.session!.rsvps[0].profiles).toEqual({ id: 'u1', username: 'Alice' })
      expect(result.session!.rsvps[1].profiles).toEqual({ id: 'u2', username: 'Bob' })
    })

    it('defaults profile to fallback when user profile is not found', async () => {
      const sessionData = {
        id: 'sess-1',
        squad_id: 's1',
        title: 'S',
        scheduled_at: '2026-02-20T18:00:00Z',
      }
      const rsvpsData = [{ session_id: 'sess-1', user_id: 'u-unknown', response: 'present' }]

      setupSSRMocks({
        user: { id: 'u1' },
        sessionData,
        rsvpsData,
        checkinsData: [],
        profilesData: [],
      })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-1' },
        context: {},
      } as any)
      expect(result.session!.rsvps[0].profiles).toEqual({ id: 'u-unknown', username: 'Joueur' })
    })

    it('does not fetch profiles when no rsvps exist', async () => {
      const sessionData = {
        id: 'sess-1',
        squad_id: 's1',
        title: 'S',
        scheduled_at: '2026-02-20T18:00:00Z',
      }

      setupSSRMocks({ user: { id: 'u1' }, sessionData, rsvpsData: [], checkinsData: [] })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-1' },
        context: {},
      } as any)
      expect(result.session!.rsvps).toEqual([])
      expect(result.session!.rsvp_counts).toEqual({ present: 0, absent: 0, maybe: 0 })
    })

    it('handles null rsvps data gracefully', async () => {
      const sessionData = {
        id: 'sess-1',
        squad_id: 's1',
        title: 'S',
        scheduled_at: '2026-02-20T18:00:00Z',
      }

      setupSSRMocks({ user: { id: 'u1' }, sessionData, rsvpsData: null, checkinsData: [] })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-1' },
        context: {},
      } as any)
      expect(result.session!.rsvps).toEqual([])
      expect(result.session!.rsvp_counts).toEqual({ present: 0, absent: 0, maybe: 0 })
    })

    it('handles null checkins data gracefully', async () => {
      const sessionData = {
        id: 'sess-1',
        squad_id: 's1',
        title: 'S',
        scheduled_at: '2026-02-20T18:00:00Z',
      }

      setupSSRMocks({ user: { id: 'u1' }, sessionData, rsvpsData: [], checkinsData: null })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-1' },
        context: {},
      } as any)
      expect(result.session!.checkins).toEqual([])
    })

    it('deduplicates user IDs for profile fetch', async () => {
      const sessionData = {
        id: 'sess-1',
        squad_id: 's1',
        title: 'S',
        scheduled_at: '2026-02-20T18:00:00Z',
      }
      // Same user_id appearing twice (edge case)
      const rsvpsData = [
        { session_id: 'sess-1', user_id: 'u1', response: 'present' },
        { session_id: 'sess-1', user_id: 'u1', response: 'maybe' },
      ]
      const profilesData = [{ id: 'u1', username: 'Alice' }]

      setupSSRMocks({ user: { id: 'u1' }, sessionData, rsvpsData, checkinsData: [], profilesData })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'sess-1' },
        context: {},
      } as any)
      // Both rsvps should get the same profile
      expect(result.session!.rsvps[0].profiles).toEqual({ id: 'u1', username: 'Alice' })
      expect(result.session!.rsvps[1].profiles).toEqual({ id: 'u1', username: 'Alice' })
    })

    it('passes headers to data() response', async () => {
      setupSSRMocks({ user: null })
      mockData.mockImplementation((d: any, opts: any) => ({ __data: d, __opts: opts }))
      await loader({ request: makeRequest(), params: { id: 'sess-1' }, context: {} } as any)
      const lastCall = mockData.mock.calls[mockData.mock.calls.length - 1]
      expect(lastCall[1]).toHaveProperty('headers')
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    it('renders inside ClientRouteWrapper (lazy component)', () => {
      const qc = makeQC()
      const loaderData = { session: null }
      render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      expect(screen.getByTestId('route-wrapper')).toBeTruthy()
    })

    it('wraps content with correct seed for session detail', () => {
      const qc = makeQC()
      const loaderData = { session: { id: 'sess-123', title: 'Game' } }
      render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds).toHaveLength(1)
      expect(seeds[0].key).toEqual(['sessions', 'detail', 'sess-123'])
    })

    it('uses empty string for session ID in seed when session is null', () => {
      const qc = makeQC()
      const loaderData = { session: null }
      render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds[0].key).toEqual(['sessions', 'detail', ''])
    })

    it('renders without crashing', () => {
      const qc = makeQC()
      const { container } = render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData: { session: null } } as any)
        )
      )
      expect(container).toBeTruthy()
    })
  })
})
