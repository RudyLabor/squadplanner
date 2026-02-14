import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Discover } from '../Discover'

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

// Mock state persistence
vi.mock('../../hooks/useStatePersistence', () => ({
  useStatePersistence: vi.fn().mockReturnValue(['', vi.fn()]),
}))

// Mock infinite scroll
vi.mock('../../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: vi.fn().mockReturnValue({ sentinelRef: { current: null } }),
}))

// Mock browse squads query
vi.mock('../../hooks/queries', () => ({
  useBrowseSquadsQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  Compass: (props: any) => createElement('span', props),
  Plus: (props: any) => createElement('span', props),
  Sparkles: (props: any) => createElement('span', props),
  Users: (props: any) => createElement('span', props),
  Gamepad2: (props: any) => createElement('span', props),
}))

// Mock UI components
vi.mock('../../components/ui', () => ({
  SegmentedControl: ({ options, value, onChange }: any) => createElement('div', { 'data-testid': 'segmented-control' }, options.map((o: any) => createElement('button', { key: o.value, onClick: () => onChange(o.value), 'data-selected': value === o.value }, o.label))),
  Select: ({ options, value, onChange }: any) => createElement('select', { value, onChange: (e: any) => onChange(e.target.value) }),
  Button: ({ children, onClick, ...props }: any) => createElement('button', { onClick, ...props }, children),
}))

vi.mock('../../components/layout/MobilePageHeader', () => ({
  MobilePageHeader: ({ title }: any) => createElement('div', { 'data-testid': 'mobile-header' }, title),
}))

// Mock discover sub-components
vi.mock('../../components/discover/DiscoverSquadCard', () => ({
  DiscoverSquadCard: ({ squad }: any) => createElement('div', { 'data-testid': `discover-squad-${squad.id}` }, squad.name),
}))

vi.mock('../../components/discover/GlobalLeaderboard', () => ({
  GlobalLeaderboard: () => createElement('div', { 'data-testid': 'global-leaderboard' }),
}))

vi.mock('../../components/discover/MatchmakingSection', () => ({
  MatchmakingSection: () => createElement('div', { 'data-testid': 'matchmaking' }),
}))

describe('Discover Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  const renderDiscover = () => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Discover)
      )
    )
  }

  it('renders without crash', () => {
    expect(() => renderDiscover()).not.toThrow()
  })

  it('renders page header', () => {
    renderDiscover()
    expect(screen.getAllByText('Découvrir').length).toBeGreaterThan(0)
  })

  it('renders tabs', () => {
    renderDiscover()
    expect(screen.getByTestId('segmented-control')).toBeDefined()
  })
})
