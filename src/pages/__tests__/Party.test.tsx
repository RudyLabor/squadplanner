import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Party } from '../Party'

/* ------------------------------------------------------------------ */
/*  vi.hoisted – variables accessible inside vi.mock factories        */
/* ------------------------------------------------------------------ */
const mocks = vi.hoisted(() => ({
  useAuthStore: vi.fn(),
  usePremiumStore: vi.fn(),
  useSquadsQuery: vi.fn(),
  useVoiceChatStore: vi.fn(),
  getSavedPartyInfo: vi.fn(),
  joinChannel: vi.fn(),
  leaveChannel: vi.fn(),
  clearNetworkQualityNotification: vi.fn(),
}))

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
    (...args: any[]) => mocks.useAuthStore(...args),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    (...args: any[]) => mocks.useAuthStore(...args),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
  usePremiumStore: Object.assign(
    (...args: any[]) => mocks.usePremiumStore(...args),
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
    (...args: any[]) => mocks.useVoiceChatStore(...args),
    { getState: vi.fn().mockReturnValue({ isConnected: false }), subscribe: vi.fn().mockReturnValue(() => {}) }
  ),
  getSavedPartyInfo: (...args: any[]) => mocks.getSavedPartyInfo(...args),
}))

// Mock query hooks
vi.mock('../../hooks/queries/useSquadsQuery', () => ({
  useSquadsQuery: (...args: any[]) => mocks.useSquadsQuery(...args),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  Loader2: (props: any) => createElement('span', { ...props, 'data-testid': 'loader' }),
}))

// Mock child components with prop capture
vi.mock('../../components/LazyConfetti', () => ({
  default: (props: any) => createElement('div', { 'data-testid': 'confetti', 'data-pieces': props.numberOfPieces }),
}))

vi.mock('../../components/NetworkQualityIndicator', () => ({
  QualityChangeToast: ({ isVisible, newQuality }: any) =>
    isVisible ? createElement('div', { 'data-testid': 'quality-toast' }, newQuality) : null,
}))

vi.mock('../party/PartyActiveSection', () => ({
  ActivePartySection: ({ squad, onLeave }: any) =>
    createElement('div', { 'data-testid': 'active-party' },
      createElement('span', null, squad.name),
      createElement('button', { 'data-testid': 'leave-btn', onClick: onLeave }, 'Leave'),
    ),
}))

vi.mock('../party/PartySquadCard', () => ({
  PartySquadCard: ({ squad, onJoin, isConnecting }: any) =>
    createElement('div', { 'data-testid': `party-squad-${squad.id}` },
      createElement('span', null, squad.name),
      createElement('span', null, `members:${squad.member_count}`),
      createElement('button', { 'data-testid': `join-${squad.id}`, onClick: onJoin, disabled: isConnecting }, 'Join'),
    ),
}))

vi.mock('../party/PartyToast', () => ({
  PartyToast: ({ message, isVisible, onClose, variant }: any) =>
    isVisible ? createElement('div', { 'data-testid': 'party-toast', 'data-variant': variant, onClick: onClose }, message) : null,
}))

vi.mock('../party/PartyEmptyState', () => ({
  PartyEmptyState: () => createElement('div', { 'data-testid': 'party-empty' }),
}))

vi.mock('../party/PartySingleSquad', () => ({
  PartySingleSquad: ({ squad, isConnecting, onJoin }: any) =>
    createElement('div', { 'data-testid': 'party-single' },
      createElement('span', null, squad.name),
      createElement('button', { 'data-testid': 'join-single', onClick: onJoin, disabled: isConnecting }, 'Join'),
    ),
  PartyStatsCard: ({ squadName }: any) => createElement('div', { 'data-testid': 'party-stats' }, squadName),
}))

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function defaultVoiceChatState(overrides = {}) {
  return {
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    currentChannel: null,
    joinChannel: mocks.joinChannel,
    leaveChannel: mocks.leaveChannel,
    networkQualityChanged: null,
    clearNetworkQualityNotification: mocks.clearNetworkQualityNotification,
    remoteUsers: [],
    ...overrides,
  }
}

describe('Party Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    // Default mocks
    mocks.useAuthStore.mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false })
    mocks.usePremiumStore.mockReturnValue({ hasPremium: false })
    mocks.useSquadsQuery.mockReturnValue({ data: [{ id: 'sq1', name: 'TestSquad', game: 'Valorant', member_count: 3 }], isLoading: false })
    mocks.useVoiceChatStore.mockReturnValue(defaultVoiceChatState())
    mocks.getSavedPartyInfo.mockReturnValue(null)
    mocks.joinChannel.mockResolvedValue(true)
    mocks.leaveChannel.mockResolvedValue(undefined)
  })

  const renderParty = () => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Party)
      )
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Basic rendering                                                  */
  /* ---------------------------------------------------------------- */
  it('renders with aria-label "Party vocale"', () => {
    renderParty()
    expect(document.querySelector('[aria-label="Party vocale"]')).not.toBeNull()
  })

  it('renders heading "Party"', () => {
    renderParty()
    expect(screen.getByText('Party')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */
  it('shows loader spinner when squads are loading', () => {
    mocks.useSquadsQuery.mockReturnValue({ data: [], isLoading: true })
    renderParty()
    expect(screen.getByTestId('loader')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Empty state                                                      */
  /* ---------------------------------------------------------------- */
  it('shows PartyEmptyState when no squads exist', () => {
    mocks.useSquadsQuery.mockReturnValue({ data: [], isLoading: false })
    renderParty()
    expect(screen.getByTestId('party-empty')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Header subtitle logic                                           */
  /* ---------------------------------------------------------------- */
  it('shows "Connecté" subtitle when isConnected is true', () => {
    mocks.useVoiceChatStore.mockReturnValue(defaultVoiceChatState({ isConnected: true, currentChannel: 'squad-sq1' }))
    renderParty()
    expect(screen.getByText('Connecté')).toBeDefined()
  })

  it('shows squad count (plural) when multiple squads and not connected', () => {
    mocks.useSquadsQuery.mockReturnValue({
      data: [
        { id: 'sq1', name: 'A', game: 'V', member_count: 2 },
        { id: 'sq2', name: 'B', game: 'V', member_count: 3 },
      ],
      isLoading: false,
    })
    renderParty()
    expect(screen.getByText('2 squads')).toBeDefined()
  })

  it('shows singular "squad" when exactly one squad and not connected', () => {
    mocks.useSquadsQuery.mockReturnValue({
      data: [{ id: 'sq1', name: 'A', game: 'V', member_count: 2 }],
      isLoading: false,
    })
    renderParty()
    expect(screen.getByText('1 squad')).toBeDefined()
  })

  it('shows "Rejoins une squad" when zero squads and not connected', () => {
    mocks.useSquadsQuery.mockReturnValue({ data: [], isLoading: false })
    renderParty()
    expect(screen.getByText('Rejoins une squad')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Online badge                                                     */
  /* ---------------------------------------------------------------- */
  it('shows "En ligne" badge when connected', () => {
    mocks.useVoiceChatStore.mockReturnValue(defaultVoiceChatState({ isConnected: true, currentChannel: 'squad-sq1' }))
    renderParty()
    expect(screen.getByText('En ligne')).toBeDefined()
  })

  it('does NOT show "En ligne" badge when disconnected', () => {
    renderParty()
    expect(screen.queryByText('En ligne')).toBeNull()
  })

  /* ---------------------------------------------------------------- */
  /*  Single squad display (PartySingleSquad)                         */
  /* ---------------------------------------------------------------- */
  it('renders PartySingleSquad when exactly 1 squad and not connected', () => {
    renderParty()
    expect(screen.getByTestId('party-single')).toBeDefined()
    expect(screen.getByText('TestSquad')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Multiple squads display (PartySquadCard grid)                   */
  /* ---------------------------------------------------------------- */
  it('renders PartySquadCard grid when multiple squads and not connected', () => {
    mocks.useSquadsQuery.mockReturnValue({
      data: [
        { id: 'sq1', name: 'Alpha', game: 'Valorant', member_count: 3 },
        { id: 'sq2', name: 'Beta', game: 'CS2', member_count: 5 },
      ],
      isLoading: false,
    })
    renderParty()
    expect(screen.getByTestId('party-squad-sq1')).toBeDefined()
    expect(screen.getByTestId('party-squad-sq2')).toBeDefined()
    expect(screen.getByText('Choisis une squad pour lancer la party')).toBeDefined()
  })

  it('renders PartyStatsCard when multiple squads displayed', () => {
    mocks.useSquadsQuery.mockReturnValue({
      data: [
        { id: 'sq1', name: 'Alpha', game: 'Valorant', member_count: 3 },
        { id: 'sq2', name: 'Beta', game: 'CS2', member_count: 5 },
      ],
      isLoading: false,
    })
    renderParty()
    expect(screen.getByTestId('party-stats')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Connected state: ActivePartySection                             */
  /* ---------------------------------------------------------------- */
  it('renders ActivePartySection when connected with matching squad', () => {
    mocks.useVoiceChatStore.mockReturnValue(defaultVoiceChatState({ isConnected: true, currentChannel: 'squad-sq1' }))
    renderParty()
    expect(screen.getByTestId('active-party')).toBeDefined()
  })

  it('does NOT render ActivePartySection when connected but squad not found', () => {
    mocks.useVoiceChatStore.mockReturnValue(defaultVoiceChatState({ isConnected: true, currentChannel: 'squad-unknown' }))
    renderParty()
    expect(screen.queryByTestId('active-party')).toBeNull()
  })

  /* ---------------------------------------------------------------- */
  /*  Connected state: "Autres squads" section                        */
  /* ---------------------------------------------------------------- */
  it('shows "Autres squads" section for non-active squads when connected', () => {
    mocks.useSquadsQuery.mockReturnValue({
      data: [
        { id: 'sq1', name: 'Alpha', game: 'Valorant', member_count: 3 },
        { id: 'sq2', name: 'Beta', game: 'CS2', member_count: 5 },
      ],
      isLoading: false,
    })
    mocks.useVoiceChatStore.mockReturnValue(defaultVoiceChatState({ isConnected: true, currentChannel: 'squad-sq1' }))
    renderParty()
    expect(screen.getByText('Autres squads')).toBeDefined()
    expect(screen.getByTestId('party-squad-sq2')).toBeDefined()
    expect(screen.queryByTestId('party-squad-sq1')).toBeNull() // active squad not in others
  })

  it('does NOT show "Autres squads" when only one squad and connected', () => {
    mocks.useVoiceChatStore.mockReturnValue(defaultVoiceChatState({ isConnected: true, currentChannel: 'squad-sq1' }))
    renderParty()
    expect(screen.queryByText('Autres squads')).toBeNull()
  })

  /* ---------------------------------------------------------------- */
  /*  handleJoinParty                                                  */
  /* ---------------------------------------------------------------- */
  it('calls joinChannel on handleJoinParty and shows success toast', async () => {
    mocks.joinChannel.mockResolvedValue(true)
    renderParty()
    fireEvent.click(screen.getByTestId('join-single'))

    await waitFor(() => {
      expect(mocks.joinChannel).toHaveBeenCalledWith('squad-sq1', 'user-1', 'TestUser', false)
    })
    await waitFor(() => {
      expect(screen.getByTestId('party-toast')).toBeDefined()
      expect(screen.getByTestId('party-toast').getAttribute('data-variant')).toBe('success')
    })
  })

  it('shows error toast when joinChannel returns false', async () => {
    mocks.joinChannel.mockResolvedValue(false)
    renderParty()
    fireEvent.click(screen.getByTestId('join-single'))

    await waitFor(() => {
      expect(screen.getByTestId('party-toast')).toBeDefined()
      expect(screen.getByTestId('party-toast').textContent).toContain('Impossible de rejoindre')
    })
  })

  it('shows error toast when joinChannel throws', async () => {
    mocks.joinChannel.mockRejectedValue(new Error('Network error'))
    renderParty()
    fireEvent.click(screen.getByTestId('join-single'))

    await waitFor(() => {
      expect(screen.getByTestId('party-toast')).toBeDefined()
      expect(screen.getByTestId('party-toast').textContent).toContain('Erreur de connexion')
    })
  })

  it('does nothing on handleJoinParty when no user', async () => {
    mocks.useAuthStore.mockReturnValue({ user: null, profile: null, isLoading: false })
    renderParty()
    fireEvent.click(screen.getByTestId('join-single'))
    await waitFor(() => {
      expect(mocks.joinChannel).not.toHaveBeenCalled()
    })
  })

  it('uses "Joueur" as fallback username when profile.username is empty', async () => {
    mocks.useAuthStore.mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: '' }, isLoading: false })
    mocks.joinChannel.mockResolvedValue(true)
    renderParty()
    fireEvent.click(screen.getByTestId('join-single'))

    await waitFor(() => {
      expect(mocks.joinChannel).toHaveBeenCalledWith('squad-sq1', 'user-1', 'Joueur', false)
    })
  })

  /* ---------------------------------------------------------------- */
  /*  handleLeaveParty                                                */
  /* ---------------------------------------------------------------- */
  it('calls leaveChannel on handleLeaveParty', async () => {
    mocks.useVoiceChatStore.mockReturnValue(defaultVoiceChatState({ isConnected: true, currentChannel: 'squad-sq1' }))
    renderParty()
    fireEvent.click(screen.getByTestId('leave-btn'))

    await waitFor(() => {
      expect(mocks.leaveChannel).toHaveBeenCalled()
    })
  })

  it('handles leaveChannel error gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.leaveChannel.mockRejectedValue(new Error('leave error'))
    mocks.useVoiceChatStore.mockReturnValue(defaultVoiceChatState({ isConnected: true, currentChannel: 'squad-sq1' }))
    renderParty()
    fireEvent.click(screen.getByTestId('leave-btn'))

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('[Party] Error leaving:', expect.any(Error))
    })
    errorSpy.mockRestore()
  })

  /* ---------------------------------------------------------------- */
  /*  member_count fallback                                           */
  /* ---------------------------------------------------------------- */
  it('uses 0 as fallback for member_count when null', () => {
    mocks.useSquadsQuery.mockReturnValue({
      data: [
        { id: 'sq1', name: 'Alpha', game: 'Valorant', member_count: null },
        { id: 'sq2', name: 'Beta', game: null, member_count: undefined },
      ],
      isLoading: false,
    })
    renderParty()
    const items = screen.getAllByText('members:0')
    expect(items.length).toBe(2)
  })

  /* ---------------------------------------------------------------- */
  /*  game fallback to 'Jeu'                                          */
  /* ---------------------------------------------------------------- */
  it('uses "Jeu" as fallback game for squads without game', () => {
    mocks.useSquadsQuery.mockReturnValue({
      data: [{ id: 'sq1', name: 'NoGame', game: null, member_count: 2 }],
      isLoading: false,
    })
    renderParty()
    // PartySingleSquad receives squad with game = 'Jeu'
    expect(screen.getByTestId('party-single')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  hasPremium passed to joinChannel                                */
  /* ---------------------------------------------------------------- */
  it('passes hasPremium=true to joinChannel when premium', async () => {
    mocks.usePremiumStore.mockReturnValue({ hasPremium: true })
    mocks.joinChannel.mockResolvedValue(true)
    renderParty()
    fireEvent.click(screen.getByTestId('join-single'))

    await waitFor(() => {
      expect(mocks.joinChannel).toHaveBeenCalledWith('squad-sq1', 'user-1', 'TestUser', true)
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Joining from the multi-squad grid                               */
  /* ---------------------------------------------------------------- */
  it('joins the correct squad from the multi-squad grid', async () => {
    mocks.useSquadsQuery.mockReturnValue({
      data: [
        { id: 'sq1', name: 'Alpha', game: 'Valorant', member_count: 3 },
        { id: 'sq2', name: 'Beta', game: 'CS2', member_count: 5 },
      ],
      isLoading: false,
    })
    mocks.joinChannel.mockResolvedValue(true)
    renderParty()
    fireEvent.click(screen.getByTestId('join-sq2'))

    await waitFor(() => {
      expect(mocks.joinChannel).toHaveBeenCalledWith('squad-sq2', 'user-1', 'TestUser', false)
    })
  })

  /* ---------------------------------------------------------------- */
  /*  isConnecting state propagation                                  */
  /* ---------------------------------------------------------------- */
  it('passes isConnecting to squad cards', () => {
    mocks.useSquadsQuery.mockReturnValue({
      data: [
        { id: 'sq1', name: 'Alpha', game: 'Valorant', member_count: 3 },
        { id: 'sq2', name: 'Beta', game: 'CS2', member_count: 5 },
      ],
      isLoading: false,
    })
    mocks.useVoiceChatStore.mockReturnValue(defaultVoiceChatState({ isConnecting: true }))
    renderParty()
    const btn = screen.getByTestId('join-sq1')
    expect(btn.getAttribute('disabled')).not.toBeNull()
  })
})
