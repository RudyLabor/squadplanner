import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  redirect: vi.fn(),
  data: vi.fn((d: any) => d),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
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
    supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }), refreshSession: vi.fn().mockResolvedValue({ data: { session: null } }) }, rpc: vi.fn().mockResolvedValue({ data: null }), from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }) },
    headers: new Headers(),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  }),
}))
vi.mock('../../components/ProtectedLayoutClient', () => ({
  ProtectedLayoutClient: ({ loaderData }: any) => createElement('div', { 'data-testid': 'protected-layout' }, 'ProtectedLayout'),
}))

import DefaultExport, { loader, clientLoader, shouldRevalidate, headers } from '../_protected'

describe('routes/_protected', () => {
  it('exports a default component that renders', () => {
    expect(DefaultExport).toBeDefined()
    const { container } = render(createElement(DefaultExport, { loaderData: { user: null, profile: null, squads: [] } } as any))
    expect(container).toBeTruthy()
  })

  it('exports loader as a function', () => {
    expect(typeof loader).toBe('function')
  })

  it('exports clientLoader as a function', () => {
    expect(typeof clientLoader).toBe('function')
  })

  it('exports shouldRevalidate that returns false', () => {
    expect(shouldRevalidate()).toBe(false)
  })

  it('exports headers function', () => {
    expect(typeof headers).toBe('function')
  })
})
