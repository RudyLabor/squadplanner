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
vi.mock('../../LazyConfetti', () => ({
  __esModule: true,
  default: () => null,
}))

import { ProfileBadges } from '../ProfileBadges'

const MockSeasonalBadges = () =>
  createElement('div', { 'data-testid': 'seasonal-badges' }, 'Seasonal')

describe('ProfileBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash', () => {
    render(
      createElement(ProfileBadges, {
        profile: { total_sessions: 0, total_checkins: 0, reliability_score: 0 },
        challengesLoaded: true,
        challengesData: { badges: [] },
        SeasonalBadgesComponent: MockSeasonalBadges,
      })
    )
    expect(screen.getByText('Succès')).toBeDefined()
  })

  it('shows achievement count for unlocked achievements', () => {
    render(
      createElement(ProfileBadges, {
        profile: { total_sessions: 25, total_checkins: 15, reliability_score: 100 },
        challengesLoaded: true,
        challengesData: { badges: [] },
        SeasonalBadgesComponent: MockSeasonalBadges,
      })
    )
    // At 25 sessions: first_step(1), team_player(5), veteran(20) = 3 session badges
    // 15 checkins: reliable(10) = 1 checkin badge
    // 100 score: perfectionist(100) = 1 score badge
    // Total = 5
    expect(screen.getByText('5/6')).toBeDefined()
  })

  it('shows seasonal badges component when loaded', () => {
    render(
      createElement(ProfileBadges, {
        profile: null,
        challengesLoaded: true,
        challengesData: { badges: [] },
        SeasonalBadgesComponent: MockSeasonalBadges,
      })
    )
    expect(screen.getByTestId('seasonal-badges')).toBeDefined()
  })

  it('shows skeleton loading for seasonal badges when not loaded', () => {
    const { container } = render(
      createElement(ProfileBadges, {
        profile: null,
        challengesLoaded: false,
        challengesData: undefined,
        SeasonalBadgesComponent: MockSeasonalBadges,
      })
    )
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders 0/6 when no achievements unlocked', () => {
    render(
      createElement(ProfileBadges, {
        profile: { total_sessions: 0, total_checkins: 0, reliability_score: 0 },
        challengesLoaded: true,
        challengesData: { badges: [] },
        SeasonalBadgesComponent: MockSeasonalBadges,
      })
    )
    expect(screen.getByText('0/6')).toBeDefined()
  })

  it('renders Badges Saisonniers heading', () => {
    render(
      createElement(ProfileBadges, {
        profile: null,
        challengesLoaded: true,
        challengesData: { badges: [] },
        SeasonalBadgesComponent: MockSeasonalBadges,
      })
    )
    expect(screen.getByText('Badges Saisonniers')).toBeDefined()
  })

  it('handles null profile gracefully', () => {
    expect(() =>
      render(
        createElement(ProfileBadges, {
          profile: null,
          challengesLoaded: true,
          challengesData: { badges: [] },
          SeasonalBadgesComponent: MockSeasonalBadges,
        })
      )
    ).not.toThrow()
  })

  it('treats new player score as 0 regardless of DB value', () => {
    // When total_sessions=0 and total_checkins=0, reliability_score should be treated as 0
    render(
      createElement(ProfileBadges, {
        profile: { total_sessions: 0, total_checkins: 0, reliability_score: 100 },
        challengesLoaded: true,
        challengesData: { badges: [] },
        SeasonalBadgesComponent: MockSeasonalBadges,
      })
    )
    // perfectionist requires 100 score but hasNoActivity = true forces score to 0
    expect(screen.getByText('0/6')).toBeDefined()
  })
})
