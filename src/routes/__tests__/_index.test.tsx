import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Navigate: ({ to }: any) => createElement('div', { 'data-testid': 'navigate', 'data-to': to }),
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

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: null, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: null }) }),
}))
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: null, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: null }) }),
}))
vi.mock('../../lib/i18n', () => ({ useT: () => (k: string) => k, useLocale: () => 'fr', useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }) }))
vi.mock('../../components/landing/FaqSection', () => ({ faqs: [{ q: 'Question?', a: 'Answer.' }] }))
vi.mock('../../pages/Landing', () => ({ default: () => createElement('div', { 'data-testid': 'landing' }, 'Landing') }))

import DefaultExport, { headers, meta } from '../_index'

describe('routes/_index', () => {
  it('exports a default component that renders', () => {
    expect(DefaultExport).toBeDefined()
    const { container } = render(createElement(DefaultExport))
    expect(container).toBeTruthy()
  })

  it('exports headers function', () => {
    expect(typeof headers).toBe('function')
    const result = headers({} as any)
    expect(result).toHaveProperty('Cache-Control')
  })

  it('exports meta function', () => {
    expect(typeof meta).toBe('function')
    const result = meta()
    expect(Array.isArray(result)).toBe(true)
    expect(result[0]).toHaveProperty('title')
  })
})
