import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/maintenance', hash: '', search: '' }),
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

// Mock icons
vi.mock('../../components/icons', () => ({
  Wrench: ({ children, ...props }: any) => createElement('span', props, children),
  RefreshCw: ({ children, ...props }: any) => createElement('span', props, children),
  ExternalLink: ({ children, ...props }: any) => createElement('span', props, children),
}))

import Maintenance from '../Maintenance'

beforeEach(() => {
  vi.useFakeTimers()
})

describe('Maintenance', () => {
  it('renders without crashing', () => {
    render(createElement(Maintenance))
    expect(screen.getByText('Maintenance en cours')).toBeTruthy()
  })

  it('renders maintenance description message', () => {
    render(createElement(Maintenance))
    expect(
      screen.getByText(
        "Nous effectuons une maintenance planifiée. L'application sera de retour très bientôt."
      )
    ).toBeTruthy()
  })

  it('renders refresh button', () => {
    render(createElement(Maintenance))
    expect(screen.getByText('Vérifier maintenant')).toBeTruthy()
  })

  it('renders follow updates link', () => {
    render(createElement(Maintenance))
    expect(screen.getByText('Suivre les mises à jour')).toBeTruthy()
  })

  it('renders countdown timer', () => {
    render(createElement(Maintenance))
    // Initial state: 0s since check, 30s until refresh
    expect(screen.getByText(/prochaine dans/)).toBeTruthy()
  })
})
