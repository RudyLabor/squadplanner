import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockResolvedValue({ data: null }),
      update: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockResolvedValue({ data: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockResolvedValue({ data: null }),
      update: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockResolvedValue({ data: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', username: 'TestUser' },
      isLoading: false,
      isInitialized: true,
    }),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
}))
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', username: 'TestUser' },
      isLoading: false,
      isInitialized: true,
    }),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))
vi.mock('../../utils/haptics', () => ({
  haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

// Mock ChallengeCard sub-component — capture props for assertions
const mockChallengeCard = vi.fn()
vi.mock('../challenges/ChallengeCard', () => ({
  ChallengeCard: (props: any) => {
    mockChallengeCard(props)
    return createElement(
      'div',
      { 'data-testid': `challenge-card-${props.challenge.id}` },
      props.challenge.title
    )
  },
}))

import { Challenges } from '../Challenges'

const makeChallenge = (overrides: any = {}) => ({
  id: 'c1',
  title: 'Daily Challenge',
  description: 'Play once',
  xp_reward: 100,
  type: 'daily' as const,
  icon: 'star',
  requirements: { type: 'play', count: 1 },
  ...overrides,
})

describe('Challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // STRICT: Verifies header, challenge count text, tab rendering, ChallengeCard rendering with correct props for a list of challenges
  it('renders header, count, tabs, and challenge cards for a mixed challenge list', () => {
    const challenges = [
      makeChallenge({ id: 'c1', title: 'Daily Task', type: 'daily' }),
      makeChallenge({ id: 'c2', title: 'Weekly Win', type: 'weekly', xp_reward: 500 }),
      makeChallenge({ id: 'c3', title: 'Season Goal', type: 'seasonal', xp_reward: 1000 }),
    ]

    render(<Challenges challenges={challenges} onClaimXP={vi.fn()} />)

    // 1. Header text
    expect(screen.getByText('Challenges')).toBeInTheDocument()
    // 2. Count subtitle
    expect(screen.getByText('3 challenges disponibles')).toBeInTheDocument()
    // 3. "Tous" tab is present
    expect(screen.getByText('Tous')).toBeInTheDocument()
    // 4. "Quotidien" tab is present (daily count > 0)
    expect(screen.getByText('Quotidien')).toBeInTheDocument()
    // 5. "Hebdo" tab is present (weekly count > 0)
    expect(screen.getByText('Hebdo')).toBeInTheDocument()
    // 6. "Saison" tab is present (seasonal count > 0)
    expect(screen.getByText('Saison')).toBeInTheDocument()
    // 7. Each challenge card rendered
    expect(screen.getByTestId('challenge-card-c1')).toBeInTheDocument()
    expect(screen.getByTestId('challenge-card-c2')).toBeInTheDocument()
    expect(screen.getByTestId('challenge-card-c3')).toBeInTheDocument()
    // 8. ChallengeCard called 3 times
    expect(mockChallengeCard).toHaveBeenCalledTimes(3)
  })

  // STRICT: Verifies empty state message, tabs still shown, and no challenge cards rendered
  it('renders empty state when challenges array is empty', () => {
    const { container } = render(<Challenges challenges={[]} onClaimXP={vi.fn()} />)

    // 1. Header still present
    expect(screen.getByText('Challenges')).toBeInTheDocument()
    // 2. Count reads "0 challenges disponibles"
    expect(screen.getByText('0 challenges disponibles')).toBeInTheDocument()
    // 3. Empty state message
    expect(screen.getByText('Aucun challenge dans cette catégorie')).toBeInTheDocument()
    // 4. No challenge cards rendered
    expect(screen.queryByTestId('challenge-card-c1')).not.toBeInTheDocument()
    // 5. "Tous" tab still exists
    expect(screen.getByText('Tous')).toBeInTheDocument()
    // 6. No claimable badge (no "a reclamer" text)
    expect(screen.queryByText(/à réclamer/)).not.toBeInTheDocument()
    // 7. ChallengeCard never called
    expect(mockChallengeCard).not.toHaveBeenCalled()
  })

  // STRICT: Verifies tab filtering by clicking a specific tab, claimable badge visibility, and tab count badges
  it('filters challenges by tab and shows claimable badge when challenges are completed', () => {
    const challenges = [
      makeChallenge({ id: 'c1', title: 'Daily Task', type: 'daily' }),
      makeChallenge({
        id: 'c2',
        title: 'Weekly Win',
        type: 'weekly',
        userProgress: {
          challenge_id: 'c2',
          progress: 5,
          target: 5,
          completed_at: '2026-01-15',
          xp_claimed: false,
        },
      }),
    ]

    render(<Challenges challenges={challenges} onClaimXP={vi.fn()} />)

    // 1. Claimable badge is shown (1 challenge completed + unclaimed)
    expect(screen.getByText('1 à réclamer')).toBeInTheDocument()
    // 2. Both challenges visible in "Tous" tab
    expect(screen.getByTestId('challenge-card-c1')).toBeInTheDocument()
    expect(screen.getByTestId('challenge-card-c2')).toBeInTheDocument()

    // 3. Click "Quotidien" tab to filter
    fireEvent.click(screen.getByText('Quotidien'))

    // 4. Only daily challenge visible
    expect(screen.getByTestId('challenge-card-c1')).toBeInTheDocument()
    // 5. Weekly challenge is no longer visible
    expect(screen.queryByTestId('challenge-card-c2')).not.toBeInTheDocument()

    // 6. Click "Hebdo" tab
    fireEvent.click(screen.getByText('Hebdo'))
    // 7. Only weekly visible
    expect(screen.getByTestId('challenge-card-c2')).toBeInTheDocument()
    expect(screen.queryByTestId('challenge-card-c1')).not.toBeInTheDocument()

    // 8. Switch back to "Tous" — both visible again
    fireEvent.click(screen.getByText('Tous'))
    expect(screen.getByTestId('challenge-card-c1')).toBeInTheDocument()
    expect(screen.getByTestId('challenge-card-c2')).toBeInTheDocument()
  })
})
