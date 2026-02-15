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
  // STRICT: verifies loading state renders exactly 3 skeletons with pulse animation, no player content
  it('renders loading skeletons while loading', () => {
    mockUseMatchmakingQuery.mockReturnValue({ data: undefined, isLoading: true })
    const { container } = render(<MatchmakingSection />)
    const pulseElements = container.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBe(3)
    pulseElements.forEach((el) => {
      expect(el.classList.contains('rounded-lg')).toBe(true)
      expect(el.classList.contains('bg-overlay-faint')).toBe(true)
      expect(el.classList.contains('h-20')).toBe(true)
    })
    expect(screen.queryByText(/Personne en recherche/)).toBeNull()
    expect(screen.queryByText('Inviter')).toBeNull()
    expect(container.querySelectorAll('button').length).toBe(0)
  })

  // STRICT: verifies empty state renders Users icon, heading, description, CTA link to /profile
  it('renders empty state when no players', () => {
    mockUseMatchmakingQuery.mockReturnValue({ data: [], isLoading: false })
    const { container } = render(<MatchmakingSection />)
    expect(screen.getByText(/Personne en recherche de squad pour le moment/)).toBeDefined()
    expect(screen.getByText(/Active la recherche de squad dans ton profil/)).toBeDefined()
    expect(screen.getByText('Activer dans mon profil')).toBeDefined()
    const ctaLink = screen.getByText('Activer dans mon profil')
    expect(ctaLink.closest('a')?.getAttribute('href')).toBe('/profile')
    expect(container.querySelector('[data-testid="icon-Users"]')).toBeTruthy()
    expect(container.querySelectorAll('.animate-pulse').length).toBe(0)
  })

  // STRICT: verifies player card renders username, level badge, bio, stats (reliability, XP, region, playstyle), preferred games, and invite button
  it('renders player cards with all details', () => {
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

    // Username and level badge
    expect(screen.getByText('player1')).toBeDefined()
    expect(screen.getByText('Nv.10')).toBeDefined()

    // Bio displayed
    expect(screen.getByText('Looking for team')).toBeDefined()

    // Stats: reliability, XP, region, playstyle
    expect(screen.getByText('90%')).toBeDefined()
    expect(screen.getByText('500 XP')).toBeDefined()
    expect(screen.getByText('EU')).toBeDefined()
    expect(screen.getByText('competitive')).toBeDefined()

    // Preferred games rendered
    expect(screen.getByText('Valorant')).toBeDefined()
    expect(screen.getByText('CS2')).toBeDefined()

    // Invite button visible (not own profile)
    expect(screen.getByText('Inviter')).toBeDefined()

    // Fallback avatar initial
    expect(screen.getByText('P')).toBeDefined()
  })

  // STRICT: verifies invite button is hidden when user_id matches current user
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
    const { container } = render(<MatchmakingSection />)
    expect(screen.queryByText('Inviter')).toBeNull()
    expect(screen.getByText('me')).toBeDefined()
    expect(screen.getByText('Nv.5')).toBeDefined()
    expect(screen.getByText('80%')).toBeDefined()
    expect(screen.getByText('200 XP')).toBeDefined()
    // No region/bio/playstyle/games when null/empty
    expect(screen.queryByText('null')).toBeNull()
    expect(container.querySelectorAll('[data-testid="icon-MapPin"]').length).toBe(0)
  })
})
