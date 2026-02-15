import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SquadDetail from '../SquadDetail'

/* ------------------------------------------------------------------ */
/*  vi.hoisted – configurable mock variables                          */
/* ------------------------------------------------------------------ */
const mocks = vi.hoisted(() => ({
  useAuthStore: vi.fn(),
  usePremiumStore: vi.fn(),
  navigate: vi.fn(),
  useParams: vi.fn(),
  useSquadQuery: vi.fn(),
  useSquadSessionsQuery: vi.fn(),
  useSquadLeaderboardQuery: vi.fn(),
  leaveSquadMutateAsync: vi.fn(),
  deleteSquadMutateAsync: vi.fn(),
  createSessionMutateAsync: vi.fn(),
  rsvpMutateAsync: vi.fn(),
  // Sub-component prop capture
  squadSettingsProps: null as any,
  squadMembersProps: null as any,
  squadSessionsProps: null as any,
  confirmDialogInstances: [] as any[],
}))

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/squad/sq1', hash: '', search: '' }),
  useNavigate: vi.fn(() => mocks.navigate),
  useParams: (...args: any[]) => mocks.useParams(...args),
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

// Mock query hooks
vi.mock('../../hooks/queries', () => ({
  useSquadQuery: (...args: any[]) => mocks.useSquadQuery(...args),
  useSquadSessionsQuery: (...args: any[]) => mocks.useSquadSessionsQuery(...args),
  useSquadLeaderboardQuery: (...args: any[]) => mocks.useSquadLeaderboardQuery(...args),
  useLeaveSquadMutation: () => ({ mutateAsync: mocks.leaveSquadMutateAsync }),
  useDeleteSquadMutation: () => ({ mutateAsync: mocks.deleteSquadMutateAsync }),
  useCreateSessionMutation: () => ({ mutateAsync: mocks.createSessionMutateAsync }),
  useRsvpMutation: () => ({ mutateAsync: mocks.rsvpMutateAsync, isPending: false }),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  ArrowLeft: (props: any) => createElement('span', { ...props, 'data-testid': 'arrow-left' }),
}))

// Mock components
vi.mock('../../components/LazyConfetti', () => ({
  default: (props: any) => createElement('div', { 'data-testid': 'confetti' }),
}))

vi.mock('../../components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => createElement('button', { onClick, ...props }, children),
  SquadDetailSkeleton: () => createElement('div', { 'data-testid': 'skeleton' }),
  CrossfadeTransition: ({ children, skeleton, isLoading }: any) => isLoading ? skeleton : children,
  ConfirmDialog: ({ open, onConfirm, onClose, title, confirmLabel, variant }: any) => {
    if (!open) return null
    return createElement('div', { 'data-testid': 'confirm-dialog' },
      createElement('span', null, title),
      createElement('button', { 'data-testid': 'confirm-btn', onClick: onConfirm }, confirmLabel),
      createElement('button', { 'data-testid': 'cancel-btn', onClick: onClose }, 'Cancel'),
    )
  },
}))

vi.mock('../../components/squads/SquadHeader', () => ({
  SquadHeader: ({ squad, isOwner }: any) => createElement('div', { 'data-testid': 'squad-header', 'data-owner': isOwner }, squad.name),
  InviteModal: ({ isOpen, onClose, squadName }: any) =>
    isOpen ? createElement('div', { 'data-testid': 'invite-modal' },
      createElement('span', null, squadName),
      createElement('button', { 'data-testid': 'close-invite', onClick: onClose }, 'Close'),
    ) : null,
  EditSquadModal: ({ onClose }: any) =>
    createElement('div', { 'data-testid': 'edit-modal' },
      createElement('button', { 'data-testid': 'close-edit', onClick: onClose }, 'Close'),
    ),
}))

vi.mock('../../components/squads/SquadMembers', () => ({
  SquadMembers: ({ onInviteClick, memberCount }: any) => {
    mocks.squadMembersProps = { onInviteClick, memberCount }
    return createElement('div', { 'data-testid': 'squad-members' },
      createElement('button', { 'data-testid': 'invite-from-members', onClick: onInviteClick }, 'Invite'),
    )
  },
}))

vi.mock('../../components/squads/SquadSessions', () => ({
  PartySection: () => createElement('div', { 'data-testid': 'party-section' }),
  SquadSessionsList: ({ onRsvp, onCreateSession, sessionsLoading }: any) => {
    mocks.squadSessionsProps = { onRsvp, onCreateSession, sessionsLoading }
    return createElement('div', { 'data-testid': 'squad-sessions' },
      createElement('button', { 'data-testid': 'rsvp-present', onClick: () => onRsvp('sess-1', 'present') }, 'Present'),
      createElement('button', { 'data-testid': 'rsvp-absent', onClick: () => onRsvp('sess-1', 'absent') }, 'Absent'),
      createElement('button', { 'data-testid': 'rsvp-maybe', onClick: () => onRsvp('sess-1', 'maybe') }, 'Maybe'),
      createElement('button', { 'data-testid': 'create-session', onClick: () => onCreateSession({ squad_id: 'sq1', scheduled_at: '2026-02-20', duration_minutes: 60, auto_confirm_threshold: 3 }) }, 'Create'),
    )
  },
}))

vi.mock('../../components/squads/SquadSettings', () => ({
  SquadSettings: (props: any) => {
    mocks.squadSettingsProps = props
    return createElement('div', { 'data-testid': 'squad-settings' },
      createElement('button', { 'data-testid': 'leave-squad', onClick: props.onLeaveSquad }, 'Leave'),
      createElement('button', { 'data-testid': 'delete-squad', onClick: props.onDeleteSquad }, 'Delete'),
      createElement('button', { 'data-testid': 'edit-squad', onClick: props.onEditSquadClick }, 'Edit'),
      createElement('button', { 'data-testid': 'invite-squad', onClick: props.onInviteClick }, 'Invite'),
    )
  },
}))

vi.mock('../../components/squads/SuccessToast', () => ({
  SuccessToast: ({ message, onClose }: any) =>
    createElement('div', { 'data-testid': 'success-toast', onClick: onClose }, message),
}))

/* ------------------------------------------------------------------ */
/*  Default data                                                       */
/* ------------------------------------------------------------------ */
const defaultSquad = {
  id: 'sq1',
  name: 'TestSquad',
  game: 'Valorant',
  owner_id: 'user-1',
  invite_code: 'ABC123',
  member_count: 3,
  members: [{ user_id: 'user-1', role: 'owner' }],
  avg_reliability_score: 80,
}

describe('SquadDetail Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    mocks.useParams.mockReturnValue({ id: 'sq1' })
    mocks.useAuthStore.mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true })
    mocks.usePremiumStore.mockReturnValue({ canAccessFeature: vi.fn().mockReturnValue(false), fetchPremiumStatus: vi.fn(), isSquadPremium: vi.fn().mockReturnValue(false) })
    mocks.useSquadQuery.mockReturnValue({ data: defaultSquad, isLoading: false })
    mocks.useSquadSessionsQuery.mockReturnValue({ data: [], isLoading: false })
    mocks.useSquadLeaderboardQuery.mockReturnValue({ data: [], isLoading: false })
    mocks.leaveSquadMutateAsync.mockResolvedValue(undefined)
    mocks.deleteSquadMutateAsync.mockResolvedValue(undefined)
    mocks.createSessionMutateAsync.mockResolvedValue(undefined)
    mocks.rsvpMutateAsync.mockResolvedValue(undefined)
    mocks.squadSettingsProps = null
    mocks.squadMembersProps = null
    mocks.squadSessionsProps = null
  })

  const renderDetail = () => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(SquadDetail)
      )
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Basic rendering                                                  */
  /* ---------------------------------------------------------------- */
  it('renders with aria-label', () => {
    renderDetail()
    expect(document.querySelector('[aria-label="Détail de la squad"]')).not.toBeNull()
  })

  it('renders squad header with squad name', () => {
    renderDetail()
    expect(screen.getByTestId('squad-header')).toBeDefined()
    expect(screen.getByTestId('squad-header').textContent).toBe('TestSquad')
  })

  it('shows back button with "Squads" text', () => {
    renderDetail()
    expect(screen.getByText('Squads')).toBeDefined()
  })

  it('navigates to /squads on back button click', () => {
    renderDetail()
    fireEvent.click(screen.getByLabelText('Retour aux squads'))
    expect(mocks.navigate).toHaveBeenCalledWith('/squads')
  })

  /* ---------------------------------------------------------------- */
  /*  Loading/skeleton                                                 */
  /* ---------------------------------------------------------------- */
  it('shows skeleton when loading and no data', () => {
    mocks.useSquadQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderDetail()
    expect(screen.getByTestId('skeleton')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Not found state                                                  */
  /* ---------------------------------------------------------------- */
  it('shows "Squad non trouvée" when squad is null and not loading', () => {
    mocks.useSquadQuery.mockReturnValue({ data: null, isLoading: false })
    renderDetail()
    expect(screen.getByText('Squad non trouvée')).toBeDefined()
    expect(screen.getByText('Retour aux squads')).toBeDefined()
  })

  it('navigates to /squads from "Retour aux squads" button in not found', () => {
    mocks.useSquadQuery.mockReturnValue({ data: null, isLoading: false })
    renderDetail()
    fireEvent.click(screen.getByText('Retour aux squads'))
    expect(mocks.navigate).toHaveBeenCalledWith('/squads')
  })

  /* ---------------------------------------------------------------- */
  /*  Auth redirect                                                    */
  /* ---------------------------------------------------------------- */
  it('navigates to /auth when initialized but no user', () => {
    mocks.useAuthStore.mockReturnValue({ user: null, isInitialized: true, profile: null, isLoading: false })
    renderDetail()
    expect(mocks.navigate).toHaveBeenCalledWith('/auth')
  })

  it('does NOT redirect when user exists', () => {
    renderDetail()
    expect(mocks.navigate).not.toHaveBeenCalledWith('/auth')
  })

  /* ---------------------------------------------------------------- */
  /*  Owner detection                                                  */
  /* ---------------------------------------------------------------- */
  it('passes isOwner=true to SquadHeader when user is owner', () => {
    renderDetail()
    expect(screen.getByTestId('squad-header').getAttribute('data-owner')).toBe('true')
  })

  it('passes isOwner=false to SquadHeader when user is NOT owner', () => {
    mocks.useSquadQuery.mockReturnValue({
      data: { ...defaultSquad, owner_id: 'other-user' },
      isLoading: false,
    })
    renderDetail()
    expect(screen.getByTestId('squad-header').getAttribute('data-owner')).toBe('false')
  })

  /* ---------------------------------------------------------------- */
  /*  Premium status fetch                                             */
  /* ---------------------------------------------------------------- */
  it('calls fetchPremiumStatus when user exists', () => {
    const fetchPremiumStatus = vi.fn()
    mocks.usePremiumStore.mockReturnValue({ canAccessFeature: vi.fn().mockReturnValue(false), fetchPremiumStatus, isSquadPremium: vi.fn().mockReturnValue(false) })
    renderDetail()
    expect(fetchPremiumStatus).toHaveBeenCalled()
  })

  /* ---------------------------------------------------------------- */
  /*  Sub-components rendered                                          */
  /* ---------------------------------------------------------------- */
  it('renders SquadMembers, SquadSettings, SquadSessionsList, PartySection', () => {
    renderDetail()
    expect(screen.getByTestId('squad-members')).toBeDefined()
    expect(screen.getByTestId('squad-settings')).toBeDefined()
    expect(screen.getByTestId('squad-sessions')).toBeDefined()
    expect(screen.getByTestId('party-section')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  handleCreateSession                                              */
  /* ---------------------------------------------------------------- */
  it('calls createSessionMutation on session creation', async () => {
    mocks.createSessionMutateAsync.mockResolvedValue({})
    renderDetail()
    fireEvent.click(screen.getByTestId('create-session'))

    await waitFor(() => {
      expect(mocks.createSessionMutateAsync).toHaveBeenCalledWith({
        squad_id: 'sq1',
        scheduled_at: '2026-02-20',
        duration_minutes: 60,
        auto_confirm_threshold: 3,
      })
    })
  })

  it('shows success toast after session creation', async () => {
    mocks.createSessionMutateAsync.mockResolvedValue({})
    renderDetail()
    fireEvent.click(screen.getByTestId('create-session'))

    await waitFor(() => {
      expect(screen.getByTestId('success-toast')).toBeDefined()
      expect(screen.getByTestId('success-toast').textContent).toContain('Session créée')
    })
  })

  it('handles createSession error gracefully', async () => {
    mocks.createSessionMutateAsync.mockRejectedValue(new Error('fail'))
    renderDetail()
    fireEvent.click(screen.getByTestId('create-session'))
    // Should not throw, error is returned
    await waitFor(() => {
      expect(mocks.createSessionMutateAsync).toHaveBeenCalled()
    })
  })

  /* ---------------------------------------------------------------- */
  /*  handleRsvp                                                       */
  /* ---------------------------------------------------------------- */
  it('shows confetti and success toast on RSVP "present"', async () => {
    renderDetail()
    fireEvent.click(screen.getByTestId('rsvp-present'))

    await waitFor(() => {
      expect(mocks.rsvpMutateAsync).toHaveBeenCalledWith({ sessionId: 'sess-1', response: 'present' })
    })
    await waitFor(() => {
      expect(screen.getByTestId('success-toast')).toBeDefined()
      expect(screen.getByTestId('success-toast').textContent).toContain('confirmé')
    })
  })

  it('shows "Absence enregistrée" on RSVP "absent"', async () => {
    renderDetail()
    fireEvent.click(screen.getByTestId('rsvp-absent'))

    await waitFor(() => {
      expect(mocks.rsvpMutateAsync).toHaveBeenCalledWith({ sessionId: 'sess-1', response: 'absent' })
    })
    await waitFor(() => {
      expect(screen.getByTestId('success-toast').textContent).toContain('Absence enregistrée')
    })
  })

  it('shows "Réponse enregistrée" on RSVP "maybe"', async () => {
    renderDetail()
    fireEvent.click(screen.getByTestId('rsvp-maybe'))

    await waitFor(() => {
      expect(mocks.rsvpMutateAsync).toHaveBeenCalledWith({ sessionId: 'sess-1', response: 'maybe' })
    })
    await waitFor(() => {
      expect(screen.getByTestId('success-toast').textContent).toContain('Réponse enregistrée')
    })
  })

  it('shows error toast on RSVP failure', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.rsvpMutateAsync.mockRejectedValue(new Error('rsvp fail'))
    renderDetail()
    fireEvent.click(screen.getByTestId('rsvp-present'))

    await waitFor(() => {
      expect(screen.getByTestId('success-toast').textContent).toContain('Erreur lors du RSVP')
    })
    errorSpy.mockRestore()
  })

  /* ---------------------------------------------------------------- */
  /*  handleLeaveSquad via ConfirmDialog                               */
  /* ---------------------------------------------------------------- */
  it('opens leave confirm dialog when leave is clicked', () => {
    renderDetail()
    fireEvent.click(screen.getByTestId('leave-squad'))

    expect(screen.getByTestId('confirm-dialog')).toBeDefined()
    expect(screen.getByText('Quitter cette squad ?')).toBeDefined()
  })

  it('calls leaveSquadMutation and navigates on confirm leave', async () => {
    renderDetail()
    fireEvent.click(screen.getByTestId('leave-squad'))
    fireEvent.click(screen.getByTestId('confirm-btn'))

    await waitFor(() => {
      expect(mocks.leaveSquadMutateAsync).toHaveBeenCalledWith('sq1')
    })
    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/squads')
    })
  })

  /* ---------------------------------------------------------------- */
  /*  handleDeleteSquad via ConfirmDialog                              */
  /* ---------------------------------------------------------------- */
  it('opens delete confirm dialog when delete is clicked', () => {
    renderDetail()
    fireEvent.click(screen.getByTestId('delete-squad'))

    expect(screen.getByTestId('confirm-dialog')).toBeDefined()
    expect(screen.getByText('Supprimer cette squad ?')).toBeDefined()
  })

  it('calls deleteSquadMutation and navigates on confirm delete', async () => {
    renderDetail()
    fireEvent.click(screen.getByTestId('delete-squad'))
    fireEvent.click(screen.getByTestId('confirm-btn'))

    await waitFor(() => {
      expect(mocks.deleteSquadMutateAsync).toHaveBeenCalledWith('sq1')
    })
    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/squads')
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Invite modal                                                     */
  /* ---------------------------------------------------------------- */
  it('opens invite modal from SquadMembers invite click', async () => {
    renderDetail()
    fireEvent.click(screen.getByTestId('invite-from-members'))

    await waitFor(() => {
      expect(screen.getByTestId('invite-modal')).toBeDefined()
    })
  })

  it('opens invite modal from SquadSettings invite click', async () => {
    renderDetail()
    fireEvent.click(screen.getByTestId('invite-squad'))

    await waitFor(() => {
      expect(screen.getByTestId('invite-modal')).toBeDefined()
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Edit modal                                                       */
  /* ---------------------------------------------------------------- */
  it('opens edit modal from SquadSettings edit click', async () => {
    renderDetail()
    fireEvent.click(screen.getByTestId('edit-squad'))

    await waitFor(() => {
      expect(screen.getByTestId('edit-modal')).toBeDefined()
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Success toast dismissal                                          */
  /* ---------------------------------------------------------------- */
  it('can dismiss success toast', async () => {
    renderDetail()
    fireEvent.click(screen.getByTestId('rsvp-absent'))

    await waitFor(() => {
      expect(screen.getByTestId('success-toast')).toBeDefined()
    })
    fireEvent.click(screen.getByTestId('success-toast'))

    await waitFor(() => {
      expect(screen.queryByTestId('success-toast')).toBeNull()
    })
  })

  /* ---------------------------------------------------------------- */
  /*  No id param edge case                                            */
  /* ---------------------------------------------------------------- */
  it('does nothing on leave when id is undefined', () => {
    mocks.useParams.mockReturnValue({ id: undefined })
    mocks.useSquadQuery.mockReturnValue({ data: null, isLoading: false })
    renderDetail()
    // Should show "not found" since no squad and no id
    expect(screen.getByText('Squad non trouvée')).toBeDefined()
  })
})
