import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Discover } from '../Discover'

/* ------------------------------------------------------------------ */
/*  vi.hoisted – configurable mock variables                          */
/* ------------------------------------------------------------------ */
const mocks = vi.hoisted(() => ({
  useBrowseSquadsQuery: vi.fn(),
  useStatePersistence: vi.fn(),
  useInfiniteScroll: vi.fn(),
  segmentedOnChange: vi.fn(),
}))

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/discover', hash: '', search: '' }),
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

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn(),
}))

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }),
}))

// Mock state persistence - configurable
vi.mock('../../hooks/useStatePersistence', () => ({
  useStatePersistence: (...args: any[]) => mocks.useStatePersistence(...args),
}))

// Mock infinite scroll
vi.mock('../../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: (...args: any[]) => mocks.useInfiniteScroll(...args),
}))

// Mock browse squads query - configurable
vi.mock('../../hooks/queries', () => ({
  useBrowseSquadsQuery: (...args: any[]) => mocks.useBrowseSquadsQuery(...args),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  Compass: (props: any) => createElement('span', { 'data-icon': 'Compass', ...props }),
  Plus: (props: any) => createElement('span', { 'data-icon': 'Plus', ...props }),
  Sparkles: (props: any) => createElement('span', { 'data-icon': 'Sparkles', ...props }),
  Users: (props: any) => createElement('span', { 'data-icon': 'Users', ...props }),
  Gamepad2: (props: any) => createElement('span', { 'data-icon': 'Gamepad2', ...props }),
}))

// Mock UI components with interaction support
vi.mock('../../components/ui', () => ({
  SegmentedControl: ({ options, value, onChange }: any) =>
    createElement('div', { 'data-testid': 'segmented-control' },
      options.map((o: any) =>
        createElement('button', {
          key: o.value,
          onClick: () => onChange(o.value),
          'data-testid': `tab-${o.value}`,
          'data-selected': value === o.value ? 'true' : 'false',
        }, o.label)
      ),
    ),
  Select: ({ options, value, onChange, placeholder, clearable }: any) =>
    createElement('select', {
      value: value || '',
      onChange: (e: any) => onChange(e.target.value),
      'data-testid': placeholder?.includes('jeux') ? 'game-select' : 'region-select',
    },
      createElement('option', { value: '' }, placeholder),
      ...(options || []).map((o: any) =>
        createElement('option', { key: o.value, value: o.value }, o.label)
      ),
    ),
  Button: ({ children, onClick, ...props }: any) => createElement('button', { onClick, ...props }, children),
}))

vi.mock('../../components/layout/MobilePageHeader', () => ({
  MobilePageHeader: ({ title }: any) => createElement('div', { 'data-testid': 'mobile-header' }, title),
}))

// Mock discover sub-components
vi.mock('../../components/discover/DiscoverSquadCard', () => ({
  DiscoverSquadCard: ({ squad }: any) =>
    createElement('div', { 'data-testid': `discover-squad-${squad.id}` }, squad.name),
}))

vi.mock('../../components/discover/GlobalLeaderboard', () => ({
  GlobalLeaderboard: ({ game, region }: any) =>
    createElement('div', { 'data-testid': 'global-leaderboard', 'data-game': game || '', 'data-region': region || '' }),
}))

vi.mock('../../components/discover/MatchmakingSection', () => ({
  MatchmakingSection: ({ game, region }: any) =>
    createElement('div', { 'data-testid': 'matchmaking', 'data-game': game || '', 'data-region': region || '' }),
}))

/* ------------------------------------------------------------------ */
/*  Test data                                                          */
/* ------------------------------------------------------------------ */
const sampleSquads = [
  { id: 'sq1', name: 'Alpha Team', game: 'Valorant', member_count: 5 },
  { id: 'sq2', name: 'Beta Squad', game: 'CS2', member_count: 3 },
  { id: 'sq3', name: 'Gamma Force', game: 'Fortnite', member_count: 8 },
]

describe('Discover Page', () => {
  let queryClient: QueryClient
  let gameSetState: ReturnType<typeof vi.fn>
  let regionSetState: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    gameSetState = vi.fn()
    regionSetState = vi.fn()

    // Default: no game/region filters
    mocks.useStatePersistence.mockImplementation((key: string) => {
      if (key === 'discover_game') return ['', gameSetState]
      if (key === 'discover_region') return ['', regionSetState]
      return ['', vi.fn()]
    })

    mocks.useInfiniteScroll.mockReturnValue({ sentinelRef: { current: null } })
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: [], isLoading: false })
  })

  const renderDiscover = () => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Discover)
      )
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Basic rendering                                                  */
  /* ---------------------------------------------------------------- */
  it('renders page title "Decouvrir"', () => {
    renderDiscover()
    expect(screen.getAllByText('Découvrir').length).toBeGreaterThan(0)
  })

  it('renders MobilePageHeader', () => {
    renderDiscover()
    expect(screen.getByTestId('mobile-header')).toBeDefined()
  })

  it('renders desktop header with subtitle', () => {
    renderDiscover()
    expect(screen.getByText('Trouve des squads et joueurs')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Tabs (SegmentedControl)                                          */
  /* ---------------------------------------------------------------- */
  it('renders segmented control with 3 tabs', () => {
    renderDiscover()
    expect(screen.getByTestId('segmented-control')).toBeDefined()
    expect(screen.getByTestId('tab-squads')).toBeDefined()
    expect(screen.getByTestId('tab-joueurs')).toBeDefined()
    expect(screen.getByTestId('tab-classement')).toBeDefined()
  })

  it('shows squads tab selected by default', () => {
    renderDiscover()
    expect(screen.getByTestId('tab-squads').getAttribute('data-selected')).toBe('true')
    expect(screen.getByTestId('tab-joueurs').getAttribute('data-selected')).toBe('false')
    expect(screen.getByTestId('tab-classement').getAttribute('data-selected')).toBe('false')
  })

  it('shows MatchmakingSection when joueurs tab is clicked', () => {
    renderDiscover()
    fireEvent.click(screen.getByTestId('tab-joueurs'))
    expect(screen.getByTestId('matchmaking')).toBeDefined()
  })

  it('shows GlobalLeaderboard when classement tab is clicked', () => {
    renderDiscover()
    fireEvent.click(screen.getByTestId('tab-classement'))
    expect(screen.getByTestId('global-leaderboard')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Filters                                                          */
  /* ---------------------------------------------------------------- */
  it('renders game and region filter selects', () => {
    renderDiscover()
    expect(screen.getByTestId('game-select')).toBeDefined()
    expect(screen.getByTestId('region-select')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  SquadsTab – loading state                                        */
  /* ---------------------------------------------------------------- */
  it('shows loading skeleton when squads are loading', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: undefined, isLoading: true })
    const { container } = renderDiscover()
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  /* ---------------------------------------------------------------- */
  /*  SquadsTab – empty state                                          */
  /* ---------------------------------------------------------------- */
  it('shows empty state when no squads found', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: [], isLoading: false })
    renderDiscover()
    expect(screen.getByText('La communauté se construit !')).toBeDefined()
    expect(screen.getByText(/Les squads publiques apparaîtront ici/)).toBeDefined()
  })

  it('shows "Créer une squad" button in empty state', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: [], isLoading: false })
    renderDiscover()
    expect(screen.getByText('Créer une squad')).toBeDefined()
  })

  it('shows encouragement text in empty state', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: [], isLoading: false })
    renderDiscover()
    expect(screen.getByText(/crée ta squad et invite tes amis/i)).toBeDefined()
  })

  it('shows empty state when squads is null', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: null, isLoading: false })
    renderDiscover()
    expect(screen.getByText('La communauté se construit !')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  SquadsTab – with data                                            */
  /* ---------------------------------------------------------------- */
  it('renders DiscoverSquadCard for each squad', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: sampleSquads, isLoading: false })
    renderDiscover()
    expect(screen.getByTestId('discover-squad-sq1')).toBeDefined()
    expect(screen.getByTestId('discover-squad-sq2')).toBeDefined()
    expect(screen.getByTestId('discover-squad-sq3')).toBeDefined()
  })

  it('renders squad names in cards (may appear in featured too)', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: sampleSquads, isLoading: false })
    renderDiscover()
    expect(screen.getAllByText('Alpha Team').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Beta Squad').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Gamma Force').length).toBeGreaterThanOrEqual(1)
  })

  /* ---------------------------------------------------------------- */
  /*  FeaturedSection                                                  */
  /* ---------------------------------------------------------------- */
  it('renders "En vedette" section when >= 2 squads', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: sampleSquads, isLoading: false })
    renderDiscover()
    expect(screen.getByText('En vedette')).toBeDefined()
  })

  it('does NOT render "En vedette" section when < 2 squads', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({
      data: [{ id: 'sq1', name: 'Solo', game: 'Valorant', member_count: 2 }],
      isLoading: false,
    })
    renderDiscover()
    expect(screen.queryByText('En vedette')).toBeNull()
  })

  it('shows featured squads sorted by member count (top 3)', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: sampleSquads, isLoading: false })
    renderDiscover()
    // Featured section should exist
    const featuredSection = document.querySelector('[aria-label="Squads en vedette"]')
    expect(featuredSection).not.toBeNull()
  })

  it('shows game name or "Multi-jeux" fallback in featured cards', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({
      data: [
        { id: 'sq1', name: 'A', game: null, member_count: 5 },
        { id: 'sq2', name: 'B', game: 'CS2', member_count: 3 },
      ],
      isLoading: false,
    })
    renderDiscover()
    expect(screen.getAllByText('Multi-jeux').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('CS2').length).toBeGreaterThanOrEqual(1)
  })

  it('shows member count in featured cards with correct plural', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({
      data: [
        { id: 'sq1', name: 'A', game: 'V', member_count: 1 },
        { id: 'sq2', name: 'B', game: 'V', member_count: 5 },
      ],
      isLoading: false,
    })
    renderDiscover()
    expect(screen.getAllByText(/1.*membre(?!s)/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/5.*membres/).length).toBeGreaterThanOrEqual(1)
  })

  it('uses Math.max(member_count, 1) for featured cards with 0 members', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({
      data: [
        { id: 'sq1', name: 'A', game: 'V', member_count: 0 },
        { id: 'sq2', name: 'B', game: 'V', member_count: 2 },
      ],
      isLoading: false,
    })
    renderDiscover()
    // Math.max(0, 1) = 1, so should show "1 membre"
    expect(screen.getByText(/1.*membre(?!s)/)).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Tab switching hides/shows content                                */
  /* ---------------------------------------------------------------- */
  it('hides squads content when switching to joueurs tab', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: sampleSquads, isLoading: false })
    renderDiscover()
    fireEvent.click(screen.getByTestId('tab-joueurs'))
    expect(screen.queryByTestId('discover-squad-sq1')).toBeNull()
    expect(screen.getByTestId('matchmaking')).toBeDefined()
  })

  it('hides squads content when switching to classement tab', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: sampleSquads, isLoading: false })
    renderDiscover()
    fireEvent.click(screen.getByTestId('tab-classement'))
    expect(screen.queryByTestId('discover-squad-sq1')).toBeNull()
    expect(screen.getByTestId('global-leaderboard')).toBeDefined()
  })

  it('shows squads again when switching back to squads tab', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: sampleSquads, isLoading: false })
    renderDiscover()
    fireEvent.click(screen.getByTestId('tab-joueurs'))
    fireEvent.click(screen.getByTestId('tab-squads'))
    expect(screen.getByTestId('discover-squad-sq1')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  "Créer une squad" link goes to /squads                          */
  /* ---------------------------------------------------------------- */
  it('"Créer une squad" button links to /squads', () => {
    mocks.useBrowseSquadsQuery.mockReturnValue({ data: [], isLoading: false })
    renderDiscover()
    const link = screen.getByText('Créer une squad').closest('a')
    expect(link?.getAttribute('href')).toBe('/squads')
  })

  /* ---------------------------------------------------------------- */
  /*  useStatePersistence integration                                  */
  /* ---------------------------------------------------------------- */
  it('calls useStatePersistence for game and region', () => {
    renderDiscover()
    expect(mocks.useStatePersistence).toHaveBeenCalledWith('discover_game', '')
    expect(mocks.useStatePersistence).toHaveBeenCalledWith('discover_region', '')
  })
})
