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
  SquadCardSkeleton: () => createElement('div', { 'data-testid': 'skeleton-squad' }),
}))
vi.mock('../../../utils/animations', () => ({
  springTap: {},
}))

import { HomeSquadsSection } from '../HomeSquadsSection'

describe('HomeSquadsSection', () => {
  const mockSquads = [
    { id: 's1', name: 'Les Gamers', game: 'Valorant', member_count: 5 },
    { id: 's2', name: 'Team Alpha', game: 'CS2', member_count: 3 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash with empty squads', () => {
    render(createElement(HomeSquadsSection, { squads: [], squadsLoading: false }))
    expect(screen.getByText('Créer ma squad')).toBeDefined()
  })

  it('renders squad list', () => {
    render(createElement(HomeSquadsSection, { squads: mockSquads, squadsLoading: false }))
    expect(screen.getByText('Les Gamers')).toBeDefined()
    expect(screen.getByText('Team Alpha')).toBeDefined()
  })

  it('shows skeleton when loading', () => {
    render(createElement(HomeSquadsSection, { squads: [], squadsLoading: true }))
    expect(screen.getAllByTestId('skeleton-squad').length).toBe(3)
  })

  it('renders game name for each squad', () => {
    render(createElement(HomeSquadsSection, { squads: mockSquads, squadsLoading: false }))
    expect(screen.getByText('Valorant')).toBeDefined()
    expect(screen.getByText('CS2')).toBeDefined()
  })

  it('renders member count with correct plural', () => {
    render(createElement(HomeSquadsSection, { squads: mockSquads, squadsLoading: false }))
    expect(screen.getByText('5 membres')).toBeDefined()
    expect(screen.getByText('3 membres')).toBeDefined()
  })

  it('renders singular membre for 1 member', () => {
    render(
      createElement(HomeSquadsSection, {
        squads: [{ id: 's1', name: 'Solo', game: 'Test', member_count: 1 }],
        squadsLoading: false,
      })
    )
    expect(screen.getByText('1 membre')).toBeDefined()
  })

  it('renders Gerer button when squads exist', () => {
    render(createElement(HomeSquadsSection, { squads: mockSquads, squadsLoading: false }))
    expect(screen.getByText('Gérer')).toBeDefined()
  })

  it('limits displayed squads to 6', () => {
    const manySquads = Array.from({ length: 10 }, (_, i) => ({
      id: `s${i}`,
      name: `Squad ${i}`,
      game: 'Game',
      member_count: 2,
    }))
    render(createElement(HomeSquadsSection, { squads: manySquads, squadsLoading: false }))
    const items = screen.getAllByText(/Squad \d/)
    expect(items.length).toBe(6)
  })

  it('has correct section aria-label', () => {
    render(createElement(HomeSquadsSection, { squads: mockSquads, squadsLoading: false }))
    expect(screen.getByLabelText('Mes squads')).toBeDefined()
  })

  it('shows empty state with CTA linking to /squads', () => {
    render(createElement(HomeSquadsSection, { squads: [], squadsLoading: false }))
    expect(screen.getByText("Tes potes t'attendent !")).toBeDefined()
    const link = screen.getByText('Créer ma squad').closest('a')
    expect(link?.getAttribute('href')).toBe('/squads')
  })

  it('uses total_members fallback for member count', () => {
    render(
      createElement(HomeSquadsSection, {
        squads: [{ id: 's1', name: 'Test', game: 'Game', total_members: 4 }],
        squadsLoading: false,
      })
    )
    expect(screen.getByText('4 membres')).toBeDefined()
  })
})
