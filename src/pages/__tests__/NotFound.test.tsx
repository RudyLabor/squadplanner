import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
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

// Mock icons
vi.mock('../../components/icons', () => ({
  Home: ({ children, ...props }: any) => createElement('span', props, children),
  Gamepad2: ({ children, ...props }: any) => createElement('span', props, children),
  ArrowLeft: ({ children, ...props }: any) => createElement('span', props, children),
  Users: ({ children, ...props }: any) => createElement('span', props, children),
  MessageCircle: ({ children, ...props }: any) => createElement('span', props, children),
  HelpCircle: ({ children, ...props }: any) => createElement('span', props, children),
}))

// Mock UI components
vi.mock('../../components/ui', () => ({
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))

import { NotFound } from '../NotFound'

describe('NotFound', () => {
  it('renders without crashing', () => {
    render(createElement(NotFound))
    expect(screen.getByRole('main')).toBeTruthy()
  })

  it('renders 404 heading', () => {
    render(createElement(NotFound))
    expect(screen.getByText('404')).toBeTruthy()
  })

  it('renders error message', () => {
    render(createElement(NotFound))
    expect(screen.getByText("Oups, cette page n'existe pas !")).toBeTruthy()
  })

  it('renders link to home', () => {
    render(createElement(NotFound))
    const homeLink = screen.getByText("Retour à l'accueil")
    expect(homeLink).toBeTruthy()
  })

  it('renders popular page links', () => {
    render(createElement(NotFound))
    expect(screen.getByText('Mes squads')).toBeTruthy()
    expect(screen.getByText('Messages')).toBeTruthy()
    expect(screen.getByText('Aide')).toBeTruthy()
  })

  it('has correct aria-label on main', () => {
    render(createElement(NotFound))
    expect(screen.getByLabelText('Page introuvable')).toBeTruthy()
  })
})
