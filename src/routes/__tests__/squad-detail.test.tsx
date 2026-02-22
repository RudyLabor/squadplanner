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
  useLocation: vi.fn().mockReturnValue({ pathname: '/squad/1', hash: '', search: '' }),
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
    squads: { detail: (id: string) => ['squads', 'detail', id] },
    sessions: { list: (id: string) => ['sessions', 'list', id] },
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

vi.mock('../../pages/SquadDetail', () => ({
  default: () => createElement('div', { 'data-testid': 'squad-detail-page' }, 'SquadDetail'),
}))

import DefaultExport, { loader, meta, headers } from '../squad-detail'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url = 'http://localhost/squad/squad-123') {
  return new Request(url)
}

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function setupSSRMocks(overrides: {
  user?: any
  error?: any
  squadData?: any
  membersData?: any
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

  fromFn.mockImplementation((table: string) => {
    if (table === 'squads') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: overrides.squadData ?? null }),
          }),
        }),
      }
    }
    if (table === 'squad_members') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: overrides.membersData ?? null }),
        }),
      }
    }
    if (table === 'sessions') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
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
describe('routes/squad-detail', () => {
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
      expect(result[0]).toEqual({ title: 'Détail Squad - Squad Planner' })
    })

    it('returns canonical link to /squads', () => {
      const result = meta()
      const canonical = result.find((m: any) => m.tagName === 'link')
      expect(canonical).toEqual({
        tagName: 'link',
        rel: 'canonical',
        href: 'https://squadplanner.fr/squads',
      })
    })

    it('returns og:url', () => {
      const result = meta()
      const ogUrl = result.find((m: any) => m.property === 'og:url')
      expect(ogUrl).toEqual({ property: 'og:url', content: 'https://squadplanner.fr/squads' })
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
    it('returns null data when getUser returns error', async () => {
      setupSSRMocks({ error: new Error('no session') })
      const result = await loader({
        request: makeRequest(),
        params: { id: 'squad-123' },
        context: {},
      } as any)
      expect(result).toEqual({ squad: null, members: [], sessions: [] })
    })

    it('returns null data when user is null', async () => {
      setupSSRMocks({ user: null })
      const result = await loader({
        request: makeRequest(),
        params: { id: 'squad-123' },
        context: {},
      } as any)
      expect(result).toEqual({ squad: null, members: [], sessions: [] })
    })

    it('fetches squad, members, and sessions in parallel', async () => {
      const squadData = {
        id: 'squad-123',
        name: 'My Squad',
        game: 'Valorant',
        invite_code: 'abc',
        owner_id: 'u1',
        created_at: '2026-01-01',
      }
      const membersData = [
        {
          user_id: 'u1',
          squad_id: 'squad-123',
          role: 'owner',
          profiles: { username: 'Alice', avatar_url: null, reliability_score: 95 },
        },
        {
          user_id: 'u2',
          squad_id: 'squad-123',
          role: 'member',
          profiles: {
            username: 'Bob',
            avatar_url: 'http://img.com/bob.png',
            reliability_score: 80,
          },
        },
      ]

      setupSSRMocks({
        user: { id: 'u1' },
        squadData,
        membersData,
        sessionsData: [],
      })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'squad-123' },
        context: {},
      } as any)
      expect(result.squad).toBeDefined()
      expect(result.squad!.id).toBe('squad-123')
      expect(result.squad!.name).toBe('My Squad')
      expect(result.squad!.members).toHaveLength(2)
      expect(result.squad!.member_count).toBe(2)
    })

    it('returns null squad when squad not found', async () => {
      setupSSRMocks({
        user: { id: 'u1' },
        squadData: null,
        membersData: [],
        sessionsData: [],
      })

      const result = await loader({
        request: makeRequest(),
        params: { id: 'nonexistent' },
        context: {},
      } as any)
      expect(result.squad).toBeNull()
    })

    it('computes member_count from members array length', async () => {
      const membersData = [
        { user_id: 'u1', squad_id: 's1', role: 'owner', profiles: null },
        { user_id: 'u2', squad_id: 's1', role: 'member', profiles: null },
        { user_id: 'u3', squad_id: 's1', role: 'member', profiles: null },
      ]
      setupSSRMocks({
        user: { id: 'u1' },
        squadData: { id: 's1', name: 'S' },
        membersData,
        sessionsData: [],
      })

      const result = await loader({
        request: makeRequest(),
        params: { id: 's1' },
        context: {},
      } as any)
      expect(result.squad!.member_count).toBe(3)
    })

    it('handles null membersData as empty members', async () => {
      setupSSRMocks({
        user: { id: 'u1' },
        squadData: { id: 's1', name: 'S' },
        membersData: null,
        sessionsData: [],
      })

      const result = await loader({
        request: makeRequest(),
        params: { id: 's1' },
        context: {},
      } as any)
      expect(result.squad!.members).toEqual([])
      expect(result.squad!.member_count).toBe(0)
    })

    it('computes RSVP counts for sessions', async () => {
      const sessionsData = [
        { id: 'sess1', squad_id: 's1', title: 'S1', scheduled_at: '2026-02-20T18:00:00Z' },
      ]
      const rsvpsData = [
        { session_id: 'sess1', user_id: 'u1', response: 'present' },
        { session_id: 'sess1', user_id: 'u2', response: 'absent' },
        { session_id: 'sess1', user_id: 'u3', response: 'maybe' },
        { session_id: 'sess1', user_id: 'u4', response: 'present' },
      ]

      setupSSRMocks({
        user: { id: 'u1' },
        squadData: { id: 's1', name: 'S' },
        membersData: [],
        sessionsData,
        rsvpsData,
      })

      const result = await loader({
        request: makeRequest(),
        params: { id: 's1' },
        context: {},
      } as any)
      expect(result.sessions).toHaveLength(1)
      expect(result.sessions[0].rsvp_counts).toEqual({ present: 2, absent: 1, maybe: 1 })
      expect(result.sessions[0].my_rsvp).toBe('present')
    })

    it('sets my_rsvp to null when user has not responded', async () => {
      const sessionsData = [
        { id: 'sess1', squad_id: 's1', title: 'S', scheduled_at: '2026-02-20T18:00:00Z' },
      ]
      const rsvpsData = [{ session_id: 'sess1', user_id: 'other', response: 'present' }]

      setupSSRMocks({
        user: { id: 'u1' },
        squadData: { id: 's1', name: 'S' },
        membersData: [],
        sessionsData,
        rsvpsData,
      })

      const result = await loader({
        request: makeRequest(),
        params: { id: 's1' },
        context: {},
      } as any)
      expect(result.sessions[0].my_rsvp).toBeNull()
    })

    it('returns empty sessions when no sessions exist', async () => {
      setupSSRMocks({
        user: { id: 'u1' },
        squadData: { id: 's1', name: 'S' },
        membersData: [],
        sessionsData: [],
      })

      const result = await loader({
        request: makeRequest(),
        params: { id: 's1' },
        context: {},
      } as any)
      expect(result.sessions).toEqual([])
    })

    it('returns empty sessions when sessionsData is null', async () => {
      setupSSRMocks({
        user: { id: 'u1' },
        squadData: { id: 's1', name: 'S' },
        membersData: [],
        sessionsData: null,
      })

      const result = await loader({
        request: makeRequest(),
        params: { id: 's1' },
        context: {},
      } as any)
      expect(result.sessions).toEqual([])
    })

    it('handles null rsvps data gracefully', async () => {
      const sessionsData = [
        { id: 'sess1', squad_id: 's1', title: 'S', scheduled_at: '2026-02-20T18:00:00Z' },
      ]
      setupSSRMocks({
        user: { id: 'u1' },
        squadData: { id: 's1', name: 'S' },
        membersData: [],
        sessionsData,
        rsvpsData: null,
      })

      const result = await loader({
        request: makeRequest(),
        params: { id: 's1' },
        context: {},
      } as any)
      expect(result.sessions[0].rsvp_counts).toEqual({ present: 0, absent: 0, maybe: 0 })
      expect(result.sessions[0].my_rsvp).toBeNull()
    })

    it('passes headers to data() response', async () => {
      setupSSRMocks({ user: null })
      mockData.mockImplementation((d: any, opts: any) => ({ __data: d, __opts: opts }))
      await loader({ request: makeRequest(), params: { id: 's1' }, context: {} } as any)
      const lastCall = mockData.mock.calls[mockData.mock.calls.length - 1]
      expect(lastCall[1]).toHaveProperty('headers')
    })
  })

  // =========================================================================
  // Component
  // =========================================================================
  describe('Component', () => {
    it('renders inside ClientRouteWrapper (lazy component shows Suspense fallback)', () => {
      const qc = makeQC()
      const loaderData = { squad: null, sessions: [] }
      render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      expect(screen.getByTestId('route-wrapper')).toBeTruthy()
    })

    it('wraps content with correct seeds for squad detail and sessions', () => {
      const qc = makeQC()
      const loaderData = {
        squad: { id: 'squad-123', name: 'Test' },
        sessions: [{ id: 'sess1' }],
      }
      render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds).toHaveLength(2)
      expect(seeds[0].key).toEqual(['squads', 'detail', 'squad-123'])
      expect(seeds[1].key).toEqual(['sessions', 'list', 'squad-123'])
    })

    it('uses empty string for squad ID in seeds when squad is null', () => {
      const qc = makeQC()
      const loaderData = { squad: null, sessions: [] }
      render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      const wrapper = screen.getByTestId('route-wrapper')
      const seeds = JSON.parse(wrapper.getAttribute('data-seeds')!)
      expect(seeds[0].key).toEqual(['squads', 'detail', ''])
      expect(seeds[1].key).toEqual(['sessions', 'list', ''])
    })

    it('renders without crashing with full data', () => {
      const qc = makeQC()
      const loaderData = {
        squad: { id: 's1', name: 'Squad', members: [], member_count: 0 },
        sessions: [{ id: 'sess1', title: 'Game Night' }],
      }
      const { container } = render(
        createElement(
          QueryClientProvider,
          { client: qc },
          createElement(DefaultExport, { loaderData } as any)
        )
      )
      expect(container).toBeTruthy()
    })
  })
})
