import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// --- Hoisted mock variables ---
const mockH = vi.hoisted(() => {
  const mockCreateMutateAsync = vi.fn().mockResolvedValue(undefined)
  const mockJoinMutateAsync = vi.fn().mockResolvedValue(undefined)
  const mockFetchPremiumStatus = vi.fn()
  const mockCanCreateSquad = vi.fn().mockReturnValue(true)

  let mockSquads: any[] = []
  let mockIsLoading = false
  let mockUser: any = { id: 'user-1' }
  let mockHasPremium = false
  let mockUserSquadCount = 1
  let mockCreatePending = false
  let mockJoinPending = false
  let mockIsInVoiceChat = false
  let mockCurrentChannel: string | null = null

  // Captured props
  let capturedSquadCardProps: any[] = []
  let capturedJoinFormProps: any = null
  let capturedCreateFormProps: any = null
  let capturedPremiumModalProps: any = null

  return {
    mockCreateMutateAsync, mockJoinMutateAsync, mockFetchPremiumStatus, mockCanCreateSquad,
    get mockSquads() { return mockSquads }, set mockSquads(v: any) { mockSquads = v },
    get mockIsLoading() { return mockIsLoading }, set mockIsLoading(v: boolean) { mockIsLoading = v },
    get mockUser() { return mockUser }, set mockUser(v: any) { mockUser = v },
    get mockHasPremium() { return mockHasPremium }, set mockHasPremium(v: boolean) { mockHasPremium = v },
    get mockUserSquadCount() { return mockUserSquadCount }, set mockUserSquadCount(v: number) { mockUserSquadCount = v },
    get mockCreatePending() { return mockCreatePending }, set mockCreatePending(v: boolean) { mockCreatePending = v },
    get mockJoinPending() { return mockJoinPending }, set mockJoinPending(v: boolean) { mockJoinPending = v },
    get mockIsInVoiceChat() { return mockIsInVoiceChat }, set mockIsInVoiceChat(v: boolean) { mockIsInVoiceChat = v },
    get mockCurrentChannel() { return mockCurrentChannel }, set mockCurrentChannel(v: any) { mockCurrentChannel = v },
    get capturedSquadCardProps() { return capturedSquadCardProps }, set capturedSquadCardProps(v: any) { capturedSquadCardProps = v },
    get capturedJoinFormProps() { return capturedJoinFormProps }, set capturedJoinFormProps(v: any) { capturedJoinFormProps = v },
    get capturedCreateFormProps() { return capturedCreateFormProps }, set capturedCreateFormProps(v: any) { capturedCreateFormProps = v },
    get capturedPremiumModalProps() { return capturedPremiumModalProps }, set capturedPremiumModalProps(v: any) { capturedPremiumModalProps = v },
  }
})

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/squads', hash: '', search: '' }),
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
  domAnimation: {}, domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn(), on: vi.fn() }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn() }),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
  m: new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...r }: any) => createElement(p, r, children) : undefined }),
  motion: new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...r }: any) => createElement(p, r, children) : undefined }),
}))

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn() },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
        }),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 0 }),
        }),
      }),
    }),
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({ user: mockH.mockUser, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false })),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({ user: mockH.mockUser, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false })),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' } }) }
  ),
  usePremiumStore: Object.assign(
    vi.fn(() => ({
      hasPremium: mockH.mockHasPremium,
      canCreateSquad: mockH.mockCanCreateSquad,
      fetchPremiumStatus: mockH.mockFetchPremiumStatus,
      userSquadCount: mockH.mockUserSquadCount,
    })),
    { getState: vi.fn().mockReturnValue({ hasPremium: false }) }
  ),
  useConfetti: vi.fn(() => ({ active: false, fire: vi.fn(), cancel: vi.fn() })),
}))

// Mock toast & i18n
vi.mock('../../lib/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn() }))
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key, useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }),
}))

// Mock voice chat
vi.mock('../../hooks/useVoiceChat', () => ({
  useVoiceChatStore: Object.assign(
    vi.fn(() => ({ isConnected: mockH.mockIsInVoiceChat, currentChannel: mockH.mockCurrentChannel, remoteUsers: [] })),
    { getState: vi.fn().mockReturnValue({ isConnected: false }), subscribe: vi.fn().mockReturnValue(() => {}) }
  ),
}))

// Mock query hooks
vi.mock('../../hooks/queries/useSquadsQuery', () => ({
  useSquadsQuery: vi.fn(() => ({ data: mockH.mockSquads, isLoading: mockH.mockIsLoading, isPending: mockH.mockIsLoading })),
  useCreateSquadMutation: vi.fn(() => ({ mutateAsync: mockH.mockCreateMutateAsync, isPending: mockH.mockCreatePending })),
  useJoinSquadMutation: vi.fn(() => ({ mutateAsync: mockH.mockJoinMutateAsync, isPending: mockH.mockJoinPending })),
}))

// Mock premium
vi.mock('../../hooks/usePremium', () => ({
  FREE_SQUAD_LIMIT: 3,
  usePremiumStore: Object.assign(
    vi.fn(() => ({
      hasPremium: mockH.mockHasPremium,
      canCreateSquad: mockH.mockCanCreateSquad,
      fetchPremiumStatus: mockH.mockFetchPremiumStatus,
      userSquadCount: mockH.mockUserSquadCount,
    })),
    { getState: vi.fn().mockReturnValue({ hasPremium: false }) }
  ),
}))

// Mock components
vi.mock('../../components/LazyConfetti', () => ({ default: () => null }))

vi.mock('../../components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => createElement('button', { onClick, ...props }, children),
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  SquadCardSkeleton: () => createElement('div', { 'data-testid': 'skeleton' }),
}))

vi.mock('../../components/icons', () => ({
  Users: (props: any) => createElement('span', props),
  Plus: (props: any) => createElement('span', props),
  UserPlus: (props: any) => createElement('span', props),
  Compass: (props: any) => createElement('span', props),
}))

vi.mock('../../components/PremiumGate', () => ({
  SquadLimitReached: ({ onUpgrade }: any) => createElement('div', { 'data-testid': 'squad-limit' },
    createElement('button', { onClick: onUpgrade, 'data-testid': 'upgrade-btn' }, 'Upgrade')
  ),
  PremiumBadge: () => createElement('span', { 'data-testid': 'premium-badge' }, 'PRO'),
}))

vi.mock('../../components/PremiumUpgradeModal', () => ({
  PremiumUpgradeModal: (props: any) => {
    mockH.capturedPremiumModalProps = props
    return props.isOpen ? createElement('div', { 'data-testid': 'premium-modal' }) : null
  },
}))

vi.mock('../squads/SquadCard', () => ({
  SquadCard: (props: any) => {
    mockH.capturedSquadCardProps.push(props)
    return createElement('div', { 'data-testid': `squad-${props.squad.id}` }, props.squad.name)
  },
}))

vi.mock('../squads/SquadForms', () => ({
  JoinSquadForm: (props: any) => {
    mockH.capturedJoinFormProps = props
    return props.show ? createElement('div', { 'data-testid': 'join-form' },
      createElement('button', { onClick: (e: any) => props.onSubmit(e || { preventDefault: () => {} }), 'data-testid': 'submit-join' }, 'Submit Join'),
      createElement('button', { onClick: props.onCancel, 'data-testid': 'cancel-join' }, 'Cancel'),
    ) : null
  },
  CreateSquadForm: (props: any) => {
    mockH.capturedCreateFormProps = props
    return props.show ? createElement('div', { 'data-testid': 'create-form' },
      createElement('button', { onClick: (e: any) => props.onSubmit(e || { preventDefault: () => {} }), 'data-testid': 'submit-create' }, 'Submit Create'),
      createElement('button', { onClick: props.onCancel, 'data-testid': 'cancel-create' }, 'Cancel'),
    ) : null
  },
}))

import Squads from '../Squads'

function makeSquad(overrides: Record<string, any> = {}) {
  return {
    id: 'sq1',
    name: 'Alpha Squad',
    game: 'Valorant',
    owner_id: 'user-1',
    invite_code: 'ABC123',
    member_count: 4,
    members: [],
    ...overrides,
  }
}

describe('Squads Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockH.mockSquads = []
    mockH.mockIsLoading = false
    mockH.mockUser = { id: 'user-1' }
    mockH.mockHasPremium = false
    mockH.mockUserSquadCount = 1
    mockH.mockCreatePending = false
    mockH.mockJoinPending = false
    mockH.mockIsInVoiceChat = false
    mockH.mockCurrentChannel = null
    mockH.mockCanCreateSquad.mockReturnValue(true)
    mockH.mockCreateMutateAsync.mockReset().mockResolvedValue(undefined)
    mockH.mockJoinMutateAsync.mockReset().mockResolvedValue(undefined)
    mockH.mockFetchPremiumStatus.mockClear()
    mockH.capturedSquadCardProps = []
    mockH.capturedJoinFormProps = null
    mockH.capturedCreateFormProps = null
    mockH.capturedPremiumModalProps = null
  })

  const renderSquads = (props = {}) =>
    render(createElement(QueryClientProvider, { client: queryClient }, createElement(Squads, props)))

  // =================== LOADING STATE ===================
  describe('Loading state', () => {
    it('shows skeletons when loading with no squads', () => {
      mockH.mockIsLoading = true
      mockH.mockSquads = []
      renderSquads()
      expect(screen.getAllByTestId('skeleton')).toHaveLength(3)
      expect(screen.getByText('Chargement...')).toBeTruthy()
    })

    it('does NOT show skeletons when loading but squads already exist', () => {
      mockH.mockIsLoading = true
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      expect(screen.queryByTestId('skeleton')).toBeNull()
      expect(screen.getByText('Alpha Squad')).toBeTruthy()
    })
  })

  // =================== EMPTY STATE ===================
  describe('Empty state', () => {
    it('shows empty state when no squads', () => {
      renderSquads()
      expect(screen.getByText('Crée ta première squad')).toBeTruthy()
      expect(screen.getByText('Rejoindre avec un code')).toBeTruthy()
      expect(screen.getByText('Créer une squad')).toBeTruthy()
    })

    it('shows subtitle "Crée ou rejoins ta première squad" with 0 squads', () => {
      renderSquads()
      expect(screen.getByText('Crée ou rejoins ta première squad')).toBeTruthy()
    })
  })

  // =================== SUBTITLE ===================
  describe('Subtitle computation', () => {
    it('shows "1 squad" with 1 squad', () => {
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      expect(screen.getByText('1 squad')).toBeTruthy()
    })

    it('shows "2 squads" with 2 squads', () => {
      mockH.mockSquads = [makeSquad(), makeSquad({ id: 'sq2', name: 'Beta' })]
      renderSquads()
      expect(screen.getByText('2 squads')).toBeTruthy()
    })
  })

  // =================== SQUAD LIST ===================
  describe('Squad list', () => {
    it('renders squad cards', () => {
      mockH.mockSquads = [makeSquad(), makeSquad({ id: 'sq2', name: 'Beta Squad' })]
      renderSquads()
      expect(screen.getByTestId('squad-sq1')).toBeTruthy()
      expect(screen.getByTestId('squad-sq2')).toBeTruthy()
    })

    it('passes isOwner correctly to SquadCard', () => {
      mockH.mockSquads = [
        makeSquad({ owner_id: 'user-1' }),
        makeSquad({ id: 'sq2', name: 'Beta', owner_id: 'other-user' }),
      ]
      renderSquads()
      expect(mockH.capturedSquadCardProps[0].isOwner).toBe(true)
      expect(mockH.capturedSquadCardProps[1].isOwner).toBe(false)
    })

    it('passes hasActiveParty when in voice chat for that squad', () => {
      mockH.mockSquads = [makeSquad()]
      mockH.mockIsInVoiceChat = true
      mockH.mockCurrentChannel = 'channel-sq1-voice'
      renderSquads()
      expect(mockH.capturedSquadCardProps[0].hasActiveParty).toBe(true)
    })

    it('passes hasActiveParty=false when not in voice chat', () => {
      mockH.mockSquads = [makeSquad()]
      mockH.mockIsInVoiceChat = false
      renderSquads()
      expect(mockH.capturedSquadCardProps[0].hasActiveParty).toBe(false)
    })
  })

  // =================== DISCOVER CARD ===================
  describe('Discover card', () => {
    it('shows discover card when less than 3 squads', () => {
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      expect(screen.getByText('Trouve de nouvelles squads')).toBeTruthy()
    })

    it('hides discover card when 3+ squads', () => {
      mockH.mockSquads = [
        makeSquad(),
        makeSquad({ id: 'sq2', name: 'B' }),
        makeSquad({ id: 'sq3', name: 'C' }),
      ]
      renderSquads()
      expect(screen.queryByText('Trouve de nouvelles squads')).toBeNull()
    })
  })

  // =================== PREMIUM LIMIT ===================
  describe('Premium limit', () => {
    it('shows squad limit banner when free user at limit', () => {
      mockH.mockHasPremium = false
      mockH.mockUserSquadCount = 3
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      expect(screen.getByTestId('squad-limit')).toBeTruthy()
    })

    it('hides squad limit banner for premium users', () => {
      mockH.mockHasPremium = true
      mockH.mockUserSquadCount = 3
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      expect(screen.queryByTestId('squad-limit')).toBeNull()
    })

    it('shows premium badge on create button when at limit', () => {
      mockH.mockHasPremium = false
      mockH.mockUserSquadCount = 3
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      expect(screen.getByTestId('premium-badge')).toBeTruthy()
    })

    it('opens premium modal when trying to create at limit', () => {
      mockH.mockHasPremium = false
      mockH.mockCanCreateSquad.mockReturnValue(false)
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      // The "Créer" button in header
      const createBtns = screen.getAllByRole('button')
      const createBtn = createBtns.find(b => b.textContent?.includes('Créer'))
      if (createBtn) {
        fireEvent.click(createBtn)
        expect(screen.getByTestId('premium-modal')).toBeTruthy()
      }
    })
  })

  // =================== JOIN FORM ===================
  describe('Join form', () => {
    it('opens join form when Rejoindre is clicked', () => {
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      const joinBtns = screen.getAllByRole('button')
      const joinBtn = joinBtns.find(b => b.textContent?.includes('Rejoindre'))
      if (joinBtn) fireEvent.click(joinBtn)
      expect(screen.getByTestId('join-form')).toBeTruthy()
    })

    it('closes join form on cancel', () => {
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      const joinBtns = screen.getAllByRole('button')
      const joinBtn = joinBtns.find(b => b.textContent?.includes('Rejoindre'))
      if (joinBtn) fireEvent.click(joinBtn)
      expect(screen.getByTestId('join-form')).toBeTruthy()
      fireEvent.click(screen.getByTestId('cancel-join'))
      expect(screen.queryByTestId('join-form')).toBeNull()
    })
  })

  // =================== CREATE FORM ===================
  describe('Create form', () => {
    it('opens create form when Créer is clicked (canCreateSquad=true)', () => {
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      const btns = screen.getAllByRole('button')
      const createBtn = btns.find(b => b.textContent?.includes('Créer'))
      if (createBtn) fireEvent.click(createBtn)
      expect(screen.getByTestId('create-form')).toBeTruthy()
    })

    it('closes create form on cancel', () => {
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      const btns = screen.getAllByRole('button')
      const createBtn = btns.find(b => b.textContent?.includes('Créer'))
      if (createBtn) fireEvent.click(createBtn)
      expect(screen.getByTestId('create-form')).toBeTruthy()
      fireEvent.click(screen.getByTestId('cancel-create'))
      expect(screen.queryByTestId('create-form')).toBeNull()
    })
  })

  // =================== FETCHES PREMIUM STATUS ===================
  describe('Premium status', () => {
    it('fetches premium status on mount', () => {
      renderSquads()
      expect(mockH.mockFetchPremiumStatus).toHaveBeenCalled()
    })
  })

  // =================== ARIA ===================
  describe('Accessibility', () => {
    it('renders with aria label "Squads"', () => {
      renderSquads()
      expect(document.querySelector('[aria-label="Squads"]')).toBeTruthy()
    })

    it('renders squad list with aria-label', () => {
      mockH.mockSquads = [makeSquad()]
      renderSquads()
      expect(document.querySelector('[aria-label="Liste des squads"]')).toBeTruthy()
    })
  })

  // =================== PAGE TITLE ===================
  describe('Page title', () => {
    it('renders "Mes Squads" title', () => {
      renderSquads()
      expect(screen.getByText('Mes Squads')).toBeTruthy()
    })
  })
})
