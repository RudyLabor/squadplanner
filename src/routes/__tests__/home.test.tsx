import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/home', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  redirect: vi.fn(),
  data: vi.fn((d: any) => d),
  Await: ({ children, resolve }: any) => {
    if (typeof children === 'function') return children(Array.isArray(resolve) ? resolve : [])
    return children
  },
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
  createMinimalSSRClient: vi.fn().mockReturnValue({
    supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }, rpc: vi.fn().mockResolvedValue({ data: null }) },
    headers: new Headers(),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  }),
}))
vi.mock('../../lib/queryClient', () => ({ queryKeys: { squads: { list: () => ['squads', 'list'] }, sessions: { upcoming: () => ['sessions', 'upcoming'] } } }))
vi.mock('../../components/ClientRouteWrapper', () => ({
  ClientRouteWrapper: ({ children }: any) => createElement('div', null, children),
}))
vi.mock('../../components/DeferredSeed', () => ({
  DeferredSeed: ({ children }: any) => createElement('div', null, children),
}))
vi.mock('../../pages/Home', () => ({ default: ({ loaderData }: any) => createElement('div', { 'data-testid': 'home' }, 'Home') }))

import DefaultExport, { loader, clientLoader, meta } from '../home'

describe('routes/home', () => {
  it('exports a default component that renders', () => {
    expect(DefaultExport).toBeDefined()
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
      createElement(QueryClientProvider, { client: qc },
        createElement(DefaultExport, { loaderData: { profile: null, squads: [], upcomingSessions: [] } } as any)
      )
    )
    expect(container).toBeTruthy()
  })

  it('exports loader as a function', () => {
    expect(typeof loader).toBe('function')
  })

  it('exports clientLoader as a function', () => {
    expect(typeof clientLoader).toBe('function')
  })

  it('exports meta function', () => {
    expect(typeof meta).toBe('function')
    const result = meta()
    expect(result[0]).toHaveProperty('title')
  })
})
