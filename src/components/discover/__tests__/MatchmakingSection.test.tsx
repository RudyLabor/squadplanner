import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { MatchmakingSection } from '../MatchmakingSection'

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

vi.mock('../../icons', () =>
  new Proxy({}, {
    get: (_t, name) =>
      typeof name === 'string'
        ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
        : undefined,
  })
)

const mockUseMatchmakingQuery = vi.fn()
vi.mock('../../../hooks/queries', () => ({
  useMatchmakingQuery: (...args: any[]) => mockUseMatchmakingQuery(...args),
}))

vi.mock('../../../hooks', () => ({
  useAuthStore: () => ({ user: { id: 'current-user' } }),
}))

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { from: vi.fn().mockReturnValue({ insert: vi.fn() }) },
}))

vi.mock('../../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

describe('MatchmakingSection', () => {
  it('renders loading skeletons while loading', () => {
    mockUseMatchmakingQuery.mockReturnValue({ data: undefined, isLoading: true })
    const { container } = render(<MatchmakingSection />)
    const pulseElements = container.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it('renders empty state when no players', () => {
    mockUseMatchmakingQuery.mockReturnValue({ data: [], isLoading: false })
    render(<MatchmakingSection />)
    expect(screen.getByText(/Personne en recherche de squad/)).toBeDefined()
  })

  it('renders player cards', () => {
    const players = [
      {
        user_id: 'u1',
        username: 'player1',
        avatar_url: null,
        level: 10,
        xp: 500,
        reliability_score: 90,
        region: 'EU',
        bio: 'Looking for team',
        playstyle: 'competitive',
        preferred_games: ['Valorant', 'CS2'],
      },
    ]
    mockUseMatchmakingQuery.mockReturnValue({ data: players, isLoading: false })
    render(<MatchmakingSection />)
    expect(screen.getByText('player1')).toBeDefined()
    expect(screen.getByText('Nv.10')).toBeDefined()
    expect(screen.getByText('Looking for team')).toBeDefined()
  })

  it('does not show invite button for own profile', () => {
    const players = [
      {
        user_id: 'current-user',
        username: 'me',
        avatar_url: null,
        level: 5,
        xp: 200,
        reliability_score: 80,
        region: null,
        bio: null,
        playstyle: null,
        preferred_games: [],
      },
    ]
    mockUseMatchmakingQuery.mockReturnValue({ data: players, isLoading: false })
    render(<MatchmakingSection />)
    expect(screen.queryByText('Inviter')).toBeNull()
  })
})
