import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Party } from '../Party'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/party', hash: '', search: '' }),
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
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
  usePremiumStore: Object.assign(
    vi.fn().mockReturnValue({ hasPremium: false }),
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

// Mock voice chat
vi.mock('../../hooks/useVoiceChat', () => ({
  useVoiceChatStore: Object.assign(
    vi.fn().mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      currentChannel: null,
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      networkQualityChanged: null,
      clearNetworkQualityNotification: vi.fn(),
      remoteUsers: [],
    }),
    { getState: vi.fn().mockReturnValue({ isConnected: false }), subscribe: vi.fn().mockReturnValue(() => {}) }
  ),
  getSavedPartyInfo: vi.fn().mockReturnValue(null),
}))

// Mock query hooks
vi.mock('../../hooks/queries/useSquadsQuery', () => ({
  useSquadsQuery: vi.fn().mockReturnValue({ data: [{ id: 'sq1', name: 'TestSquad', game: 'Valorant', member_count: 3 }], isLoading: false }),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  Loader2: (props: any) => createElement('span', props),
}))

// Mock components
vi.mock('../../components/LazyConfetti', () => ({
  default: () => null,
}))

vi.mock('../../components/NetworkQualityIndicator', () => ({
  QualityChangeToast: () => null,
}))

vi.mock('../party/PartyActiveSection', () => ({
  ActivePartySection: () => createElement('div', { 'data-testid': 'active-party' }),
}))

vi.mock('../party/PartySquadCard', () => ({
  PartySquadCard: ({ squad }: any) => createElement('div', { 'data-testid': `party-squad-${squad.id}` }, squad.name),
}))

vi.mock('../party/PartyToast', () => ({
  PartyToast: () => null,
}))

vi.mock('../party/PartyEmptyState', () => ({
  PartyEmptyState: () => createElement('div', { 'data-testid': 'party-empty' }),
}))

vi.mock('../party/PartySingleSquad', () => ({
  PartySingleSquad: ({ squad }: any) => createElement('div', { 'data-testid': 'party-single' }, squad.name),
  PartyStatsCard: () => createElement('div', { 'data-testid': 'party-stats' }),
}))

describe('Party Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  const renderParty = () => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Party)
      )
    )
  }

  it('renders without crash', () => {
    expect(() => renderParty()).not.toThrow()
  })

  it('renders page heading', () => {
    renderParty()
    expect(screen.getByText('Party')).toBeDefined()
  })

  it('renders with aria label', () => {
    renderParty()
    expect(document.querySelector('[aria-label="Party vocale"]')).toBeDefined()
  })
})
