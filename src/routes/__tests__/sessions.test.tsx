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

const mockClientGetSession = vi.hoisted(() => vi.fn())
const mockClientFrom = vi.hoisted(() => vi.fn())

// ---------------------------------------------------------------------------
// vi.mock declarations
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/sessions', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
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

vi.mock('../../lib/supabase-minimal-ssr', () => ({
  createMinimalSSRClient: mockCreateMinimalSSRClient,
}))

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: mockClientGetSession },
    from: mockClientFrom,
  },
}))

vi.mock('../../lib/queryClient', () => ({
  queryClient: { getQueryData: vi.fn().mockReturnValue(undefined) },
  queryKeys: {
    squads: { list: () => ['squads', 'list'] },
    sessions: { upcoming: () => ['sessions', 'upcoming'] },
  },
}))

vi.mock('../../components/ClientRouteWrapper', () => ({
  ClientRouteWrapper: ({ children, seeds }: any) =>
    createElement('div', { 'data-testid': 'route-wrapper', 'data-seeds': JSON.stringify(seeds) }, children),
}))

vi.mock('../../pages/Sessions', () => ({
  Sessions: ({ loaderData }: any) =>
    createElement('div', { 'data-testid': 'sessions-page' }, JSON.stringify(loaderData)),
}))

import DefaultExport, { loader, clientLoader, meta, headers } from '../sessions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url = 'http://localhost/sessions') {
  return new Request(url)
}

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function setupSSRMocks(overrides: {
  user?: any
  error?: any
  membershipsData?: any
  sessionsData?: any
  rsvpsData?: any
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

  // Build chained query mocks per table
  fromFn.mockImplementation((table: string) => {
    if (table === 'squad_members') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: overrides.membershipsData ?? null }),
        }),
      }
    }
    if (table === 'sessions') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: overrides.sessionsData ?? null }),
          }),
        }),
      }
    }
    if (table === 'session_rsvps') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: overrides.rsvpsData ?? null }),
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
describe('routes/sessions', () => {
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
      expect(result[0]).toEqual({ title: 'Sessions - Squad Planner' })
    })

    it('returns description meta tag', () => {
      const result = meta()
      const desc = result.find((m: any) => m.name === 'description')
      expect(desc).toBeDefined()
      expect(desc!.content).toContain('sessions')
    })

    it('returns canonical link', () => {
      const result = meta()
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({ tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/sessions' })
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
    it('returns empty data when getUser returns an error', async () => {
      setupSSRMocks({ error: new Error('no session') })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result).toEqual({ squads: [], sessions: [] })
    })

    it('returns empty data when user is null', async () => {
      setupSSRMocks({ user: null })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result).toEqual({ squads: [], sessions: [] })
    })

    it('fetches squads from memberships and returns empty sessions when user has no squads', async () => {
      setupSSRMocks({ user: { id: 'u1', email: 'u@t.com' }, membershipsData: [] })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.squads).toEqual([])
      expect(result.sessions).toEqual([])
    })

    it('returns squads mapped from memberships', async () => {
      const memberships = [
        { squad_id: 's1', squads: { id: 's1', name: 'Alpha', game: 'Valorant', invite_code: 'aaa', owner_id: 'u1', created_at: '2026-01-01' } },
        { squad_id: 's2', squads: { id: 's2', name: 'Beta', game: 'LoL', invite_code: 'bbb', owner_id: 'u2', created_at: '2026-01-02' } },
      ]
      setupSSRMocks({ user: { id: 'u1', email: 'u@t.com' }, membershipsData: memberships })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.squads).toHaveLength(2)
      expect(result.squads[0].name).toBe('Alpha')
      expect(result.squads[1].name).toBe('Beta')
    })

    it('fetches sessions for squad IDs and computes RSVP counts', async () => {
      const memberships = [
        { squad_id: 's1', squads: { id: 's1', name: 'Alpha', game: 'V', invite_code: 'a', owner_id: 'u1', created_at: '2026-01-01' } },
      ]
      const sessions = [
        { id: 'sess1', squad_id: 's1', title: 'Session 1', scheduled_at: '2026-02-01T18:00:00Z' },
        { id: 'sess2', squad_id: 's1', title: 'Session 2', scheduled_at: '2026-02-02T18:00:00Z' },
      ]
      const rsvps = [
        { session_id: 'sess1', user_id: 'u1', response: 'present' },
        { session_id: 'sess1', user_id: 'u2', response: 'absent' },
        { session_id: 'sess1', user_id: 'u3', response: 'maybe' },
        { session_id: 'sess2', user_id: 'u1', response: 'present' },
      ]

      setupSSRMocks({ user: { id: 'u1' }, membershipsData: memberships, sessionsData: sessions, rsvpsData: rsvps })

      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.sessions).toHaveLength(2)

      // Session 1: 1 present, 1 absent, 1 maybe; user u1 is 'present'
      expect(result.sessions[0].my_rsvp).toBe('present')
      expect(result.sessions[0].rsvp_counts).toEqual({ present: 1, absent: 1, maybe: 1 })

      // Session 2: 1 present
      expect(result.sessions[1].my_rsvp).toBe('present')
      expect(result.sessions[1].rsvp_counts).toEqual({ present: 1, absent: 0, maybe: 0 })
    })

    it('sets my_rsvp to null when user has no RSVP for a session', async () => {
      const memberships = [
        { squad_id: 's1', squads: { id: 's1', name: 'A', game: 'G', invite_code: 'x', owner_id: 'o', created_at: '2026-01-01' } },
      ]
      const sessions = [{ id: 'sess1', squad_id: 's1', title: 'S', scheduled_at: '2026-02-01T18:00:00Z' }]
      const rsvps = [{ session_id: 'sess1', user_id: 'other-user', response: 'present' }]

      setupSSRMocks({ user: { id: 'u1' }, membershipsData: memberships, sessionsData: sessions, rsvpsData: rsvps })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.sessions[0].my_rsvp).toBeNull()
    })

    it('handles null rsvps data gracefully', async () => {
      const memberships = [
        { squad_id: 's1', squads: { id: 's1', name: 'A', game: 'G', invite_code: 'x', owner_id: 'o', created_at: '2026-01-01' } },
      ]
      const sessions = [{ id: 'sess1', squad_id: 's1', title: 'S', scheduled_at: '2026-02-01T18:00:00Z' }]

      setupSSRMocks({ user: { id: 'u1' }, membershipsData: memberships, sessionsData: sessions, rsvpsData: null })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.sessions[0].rsvp_counts).toEqual({ present: 0, absent: 0, maybe: 0 })
      expect(result.sessions[0].my_rsvp).toBeNull()
    })

    it('returns empty sessions when sessionsData is empty', async () => {
      const memberships = [
        { squad_id: 's1', squads: { id: 's1', name: 'A', game: 'G', invite_code: 'x', owner_id: 'o', created_at: '2026-01-01' } },
      ]
      setupSSRMocks({ user: { id: 'u1' }, membershipsData: memberships, sessionsData: [] })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.sessions).toEqual([])
    })

    it('returns empty sessions when sessionsData is null', async () => {
      const memberships = [
        { squad_id: 's1', squads: { id: 's1', name: 'A', game: 'G', invite_code: 'x', owner_id: 'o', created_at: '2026-01-01' } },
      ]
      setupSSRMocks({ user: { id: 'u1' }, membershipsData: memberships, sessionsData: null })
      const result = await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(result.sessions).toEqual([])
    })

    it('passes headers to data() response', async () => {
      setupSSRMocks({ user: null })
      mockData.mockImplementation((d: any, opts: any) => ({ __data: d, __opts: opts }))

      await loader({ request: makeRequest(), params: {}, context: {} } as any)
      expect(mockData).toHaveBeenCalled()
      const lastCall = mockData.mock.calls[mockData.mock.calls.length - 1]
      expect(lastCall[1]).toHaveProperty('headers')
    })
  })

  // =========================================================================
  // clientLoader
  // =========================================================================
  describe('clientLoader', () => {
    it('returns empty data when user is null', async () => {
      mockClientGetSession.mockResolvedValue({ data: { session: null } })
      const result = await clientLoader({ serverLoader: vi.fn() } as any)
      expect(result).toEqual({ squads: [], sessions: [] })
    })

    it('fetches squads and sessions on client', async () => {
      const user = { id: 'c1', email: 'c@t.com' }
      mockClientGetSession.mockResolvedValue({ data: { session: { user } } })

      const memberships = [
        { squad_id: 's1', squads: { id: 's1', name: 'CS', game: 'G', invite_code: 'a', owner_id: 'c1', created_at: '2026-01-01' } },
      ]
      const sessions = [{ id: 'sess1', squad_id: 's1', title: 'S', scheduled_at: '2026-02-01T18:00:00Z' }]
      const rsvps = [{ session_id: 'sess1', user_id: 'c1', response: 'maybe' }]

      mockClientFrom.mockImplementation((table: string) => {
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: memberships }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: sessions }),
              }),
            }),
          }
        }
        if (table === 'session_rsvps') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: rsvps }),
            }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      })

      const result = await clientLoader({ serverLoader: vi.fn() } as any)
      expect(result.squads).toHaveLength(1)
      expect(result.sessions).toHaveLength(1)
      expect(result.sessions[0].my_rsvp).toBe('maybe')
      expect(result.sessions[0].rsvp_counts).toEqual({ present: 0, absent: 0, maybe: 1 })
    })

    it('returns empty sessions when no squad IDs', async () => {
      mockClientGetSession.mockResolvedValue({ data: { session: { user: { id: 'c1' } } } })
      mockClientFrom.mockImplementation((table: string) => {
        if (table === 'squad_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      })

      const result = await clientLoader({ serverLoader: vi.fn() } as any)
      expect(result.squads).toEqual([])
      expect(result.sessions).toEqual([])
    })

    it('has hydrate set to true', () => {
      expect(clientLoader.hydrate).toBe(true)
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    it('renders inside ClientRouteWrapper with Suspense fallback (lazy component)', () => {
      const qc = makeQC()
      const loaderData = { squads: [{ id: 's1', name: 'A' }], sessions: [] }
      render(
        createElement(QueryClientProvider, { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      // Lazy component shows Suspense fallback (spinner) initially
      const wrapper = screen.getByTestId('route-wrapper')
      expect(wrapper).toBeTruthy()
    })

    it('wraps content in ClientRouteWrapper with correct seeds', () => {
      const qc = makeQC()
      const loaderData = { squads: [{ id: 's1' }], sessions: [{ id: 'sess1' }] }
      render(
        createElement(QueryClientProvider, { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds).toHaveLength(2)
      expect(seeds[0].key).toEqual(['squads', 'list'])
      expect(seeds[1].key).toEqual(['sessions', 'upcoming'])
    })

    it('seeds contain loaderData squads and sessions', () => {
      const qc = makeQC()
      const squads = [{ id: 's1', name: 'TestSquad' }]
      const sessions = [{ id: 'sess1', title: 'Game Night' }]
      render(
        createElement(QueryClientProvider, { client: qc },
          createElement(DefaultExport, { loaderData: { squads, sessions } } as any)
        )
      )
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds[0].data).toEqual(squads)
      expect(seeds[1].data).toEqual(sessions)
    })

    it('renders with empty loaderData without crashing', () => {
      const qc = makeQC()
      const { container } = render(
        createElement(QueryClientProvider, { client: qc },
          createElement(DefaultExport, { loaderData: { squads: [], sessions: [] } } as any)
        )
      )
      expect(container).toBeTruthy()
    })
  })
})
