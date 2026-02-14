import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/squad/1', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({ id: '1' }),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  redirect: vi.fn(),
  data: vi.fn((d: any) => d),
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
    supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), order: vi.fn().mockResolvedValue({ data: [] }), in: vi.fn().mockResolvedValue({ data: [] }) }) },
    headers: new Headers(),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  }),
}))
vi.mock('../../lib/queryClient', () => ({ queryKeys: { squads: { detail: (id: string) => ['squads', 'detail', id] }, sessions: { list: (id: string) => ['sessions', 'list', id] } } }))
vi.mock('../../components/ClientRouteWrapper', () => ({
  ClientRouteWrapper: ({ children }: any) => createElement('div', null, children),
}))
vi.mock('../../pages/SquadDetail', () => ({ default: () => createElement('div', { 'data-testid': 'squad-detail' }, 'SquadDetail') }))

import DefaultExport, { loader, meta } from '../squad-detail'

describe('routes/squad-detail', () => {
  it('exports a default component that renders', () => {
    expect(DefaultExport).toBeDefined()
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
      createElement(QueryClientProvider, { client: qc },
        createElement(DefaultExport, { loaderData: { squad: null, sessions: [] } } as any)
      )
    )
    expect(container).toBeTruthy()
  })

  it('exports loader as a function', () => {
    expect(typeof loader).toBe('function')
  })

  it('exports meta function', () => {
    expect(typeof meta).toBe('function')
    const result = meta()
    expect(result[0]).toHaveProperty('title')
  })
})
