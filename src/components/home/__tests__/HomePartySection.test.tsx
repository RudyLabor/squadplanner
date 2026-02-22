import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

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

vi.mock(
  '../../icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, p) =>
          typeof p === 'string'
            ? (props: any) => createElement('span', { 'data-testid': `icon-${p}`, ...props })
            : undefined,
      }
    )
)
vi.mock('../../ui', () => ({
  Card: ({ children, ...props }: any) =>
    createElement('div', { 'data-testid': 'card', ...props }, children),
}))

import { HomePartySection } from '../HomePartySection'

describe('HomePartySection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash with no party', () => {
    const { container } = render(
      createElement(HomePartySection, {
        activeParty: null,
        showCTA: false,
      })
    )
    expect(container).toBeDefined()
  })

  it('renders nothing when no active party and no CTA', () => {
    const { container } = render(
      createElement(HomePartySection, {
        activeParty: null,
        showCTA: false,
      })
    )
    expect(container.textContent).toBe('')
  })

  it('renders active party card', () => {
    render(
      createElement(HomePartySection, {
        activeParty: { squadName: 'Test Squad', participantCount: 3 },
        showCTA: false,
      })
    )
    expect(screen.getByText(/3 potes dans Test Squad/)).toBeDefined()
    expect(screen.getByText('Party vocale en cours')).toBeDefined()
    expect(screen.getByText('Rejoindre')).toBeDefined()
  })

  it('uses singular "pote" for 1 participant', () => {
    render(
      createElement(HomePartySection, {
        activeParty: { squadName: 'Solo', participantCount: 1 },
        showCTA: false,
      })
    )
    expect(screen.getByText('1 pote dans Solo')).toBeDefined()
  })

  it('renders CTA when showCTA is true', () => {
    render(
      createElement(HomePartySection, {
        activeParty: null,
        showCTA: true,
      })
    )
    expect(screen.getByText('Lance la party vocale !')).toBeDefined()
    expect(screen.getByText('Retrouve ta squad en un clic, vocal toujours ouvert')).toBeDefined()
  })

  it('renders both active party and CTA together', () => {
    render(
      createElement(HomePartySection, {
        activeParty: { squadName: 'Team Alpha', participantCount: 2 },
        showCTA: true,
      })
    )
    expect(screen.getByText('2 potes dans Team Alpha')).toBeDefined()
    expect(screen.getByText('Lance la party vocale !')).toBeDefined()
  })

  it('active party card links to /party', () => {
    render(
      createElement(HomePartySection, {
        activeParty: { squadName: 'Team', participantCount: 3 },
        showCTA: false,
      })
    )
    const link = screen.getByText('Rejoindre').closest('a')
    expect(link?.getAttribute('href')).toBe('/party')
  })

  it('CTA links to /party', () => {
    render(
      createElement(HomePartySection, {
        activeParty: null,
        showCTA: true,
      })
    )
    const link = screen.getByText('Lance la party vocale !').closest('a')
    expect(link?.getAttribute('href')).toBe('/party')
  })
})
