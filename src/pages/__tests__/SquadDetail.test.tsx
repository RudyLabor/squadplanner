import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SquadDetail from '../SquadDetail'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/squad/sq1', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({ id: 'sq1' }),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => children,
    m: new Proxy({}, {
      get: (_target, prop) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      },
    }),
    motion: new Proxy({}, {
      get: (_target, prop) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      },
    }),
  }
})

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
  usePremiumStore: Object.assign(
    vi.fn().mockReturnValue({ canAccessFeature: vi.fn().mockReturnValue(false), fetchPremiumStatus: vi.fn(), isSquadPremium: vi.fn().mockReturnValue(false) }),
    { getState: vi.fn().mockReturnValue({ hasPremium: false }) }
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

// Mock query hooks
vi.mock('../../hooks/queries', () => ({
  useSquadQuery: vi.fn().mockReturnValue({ data: {
    id: 'sq1',
    name: 'TestSquad',
    game: 'Valorant',
    owner_id: 'user-1',
    invite_code: 'ABC123',
    member_count: 3,
    members: [{ user_id: 'user-1', role: 'owner' }],
    avg_reliability_score: 80,
  }, isLoading: false }),
  useSquadSessionsQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useSquadLeaderboardQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useLeaveSquadMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useDeleteSquadMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useCreateSessionMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useRsvpMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  ArrowLeft: (props: any) => createElement('span', props),
}))

// Mock components
vi.mock('../../components/LazyConfetti', () => ({
  default: () => null,
}))

vi.mock('../../components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => createElement('button', { onClick, ...props }, children),
  SquadDetailSkeleton: () => createElement('div', { 'data-testid': 'skeleton' }),
  CrossfadeTransition: ({ children, skeleton, isLoading }: any) => isLoading ? skeleton : children,
  ConfirmDialog: () => null,
}))

vi.mock('../../components/squads/SquadHeader', () => ({
  SquadHeader: ({ squad }: any) => createElement('div', { 'data-testid': 'squad-header' }, squad.name),
  InviteModal: () => null,
  EditSquadModal: () => null,
}))

vi.mock('../../components/squads/SquadMembers', () => ({
  SquadMembers: () => createElement('div', { 'data-testid': 'squad-members' }),
}))

vi.mock('../../components/squads/SquadSessions', () => ({
  PartySection: () => createElement('div', { 'data-testid': 'party-section' }),
  SquadSessionsList: () => createElement('div', { 'data-testid': 'squad-sessions' }),
}))

vi.mock('../../components/squads/SquadSettings', () => ({
  SquadSettings: () => createElement('div', { 'data-testid': 'squad-settings' }),
}))

vi.mock('../../components/squads/SuccessToast', () => ({
  SuccessToast: () => null,
}))

describe('SquadDetail Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  const renderSquadDetail = () => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(SquadDetail)
      )
    )
  }

  it('renders without crash', () => {
    expect(() => renderSquadDetail()).not.toThrow()
  })

  it('renders squad header', () => {
    renderSquadDetail()
    expect(screen.getByTestId('squad-header')).toBeDefined()
  })

  it('renders with aria label', () => {
    renderSquadDetail()
    expect(document.querySelector('[aria-label="Détail de la squad"]')).toBeDefined()
  })
})
