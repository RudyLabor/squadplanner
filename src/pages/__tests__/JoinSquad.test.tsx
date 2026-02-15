import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createElement } from 'react'

/* ------------------------------------------------------------------ */
/*  vi.hoisted – configurable mock variables                          */
/* ------------------------------------------------------------------ */
const mocks = vi.hoisted(() => ({
  useParams: vi.fn(),
  navigate: vi.fn(),
  useAuthStore: vi.fn(),
  joinSquad: vi.fn(),
  fetchSquads: vi.fn(),
  supabaseFrom: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

vi.mock('react-router', () => ({
  useParams: (...args: any[]) => mocks.useParams(...args),
  useNavigate: vi.fn(() => mocks.navigate),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
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

vi.mock('../../components/icons', () => ({
  Users: ({ children, ...props }: any) => createElement('span', props, children),
  Loader2: ({ children, ...props }: any) => createElement('span', props, children),
  CheckCircle2: ({ children, ...props }: any) => createElement('span', props, children),
  XCircle: ({ children, ...props }: any) => createElement('span', props, children),
  LogIn: ({ children, ...props }: any) => createElement('span', props, children),
}))

vi.mock('../../components/ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) =>
    createElement('button', { onClick, disabled, ...props }, children),
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    (...args: any[]) => mocks.useAuthStore(...args),
    { getState: vi.fn().mockReturnValue({ user: null }) }
  ),
}))

vi.mock('../../hooks/useSquads', () => ({
  useSquadsStore: vi.fn(() => ({ joinSquad: mocks.joinSquad, fetchSquads: mocks.fetchSquads })),
}))

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    from: (...args: any[]) => mocks.supabaseFrom(...args),
  },
}))

vi.mock('../../lib/toast', () => ({
  showSuccess: (...args: any[]) => mocks.showSuccess(...args),
  showError: (...args: any[]) => mocks.showError(...args),
}))

import { JoinSquad } from '../JoinSquad'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function mockSupabaseSquadFound(squad = { id: 'sq1', name: 'CoolSquad', game: 'Valorant' }, memberCount = 5) {
  mocks.supabaseFrom.mockImplementation((table: string) => {
    if (table === 'squads') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: squad, error: null }),
          }),
        }),
      }
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: memberCount }),
      }),
    }
  })
}

function mockSupabaseSquadNotFound() {
  mocks.supabaseFrom.mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      }),
    }),
  }))
}

function mockSupabaseSquadError() {
  mocks.supabaseFrom.mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockRejectedValue(new Error('network error')),
      }),
    }),
  }))
}

describe('JoinSquad Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mocks.useParams.mockReturnValue({ code: 'ABC123' })
    mocks.useAuthStore.mockReturnValue({ user: null, isInitialized: true })
    mocks.joinSquad.mockResolvedValue({ error: null })
    mocks.fetchSquads.mockResolvedValue(undefined)
    mockSupabaseSquadNotFound()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */
  it('shows loading state when not initialized', () => {
    mocks.useAuthStore.mockReturnValue({ user: null, isInitialized: false })
    render(<JoinSquad />)
    expect(screen.getByText("Chargement de l'invitation...")).toBeDefined()
  })

  it('has correct aria-label on all views', () => {
    mocks.useAuthStore.mockReturnValue({ user: null, isInitialized: false })
    const { container } = render(<JoinSquad />)
    expect(container.querySelector('[aria-label="Rejoindre une squad"]')).not.toBeNull()
  })

  /* ---------------------------------------------------------------- */
  /*  Not found state                                                  */
  /* ---------------------------------------------------------------- */
  it('shows "Invitation invalide" when squad not found', async () => {
    mockSupabaseSquadNotFound()
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Invitation invalide')).toBeDefined()
    })
    expect(screen.getByText("Ce code d'invitation n'existe pas ou a expiré.")).toBeDefined()
  })

  it('shows not-found when code param is undefined', async () => {
    mocks.useParams.mockReturnValue({ code: undefined })
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Invitation invalide')).toBeDefined()
    })
  })

  it('shows not-found when supabase throws', async () => {
    mockSupabaseSquadError()
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Invitation invalide')).toBeDefined()
    })
  })

  it('has "Retour" link in not-found state linking to /', async () => {
    mockSupabaseSquadNotFound()
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Invitation invalide')).toBeDefined()
    })
    const links = screen.getAllByText("Retour à l'accueil")
    expect(links[0].closest('a')?.getAttribute('href')).toBe('/')
  })

  /* ---------------------------------------------------------------- */
  /*  Preview state – not logged in                                    */
  /* ---------------------------------------------------------------- */
  it('shows squad preview with name, game when found', async () => {
    mockSupabaseSquadFound({ id: 'sq1', name: 'MaSquad', game: 'Fortnite' }, 4)
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('MaSquad')).toBeDefined()
    })
    expect(screen.getByText('Fortnite')).toBeDefined()
  })

  it('shows plural "membres" for >1 members', async () => {
    mockSupabaseSquadFound({ id: 'sq1', name: 'A', game: 'B' }, 3)
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('3 membres')).toBeDefined()
    })
  })

  it('shows singular "membre" for 1 member', async () => {
    mockSupabaseSquadFound({ id: 'sq1', name: 'A', game: 'B' }, 1)
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('1 membre')).toBeDefined()
    })
  })

  it('shows "Se connecter" button when not logged in', async () => {
    mockSupabaseSquadFound()
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Se connecter')).toBeDefined()
    })
  })

  it('shows login prompt text when not logged in', async () => {
    mockSupabaseSquadFound()
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Connecte-toi pour rejoindre cette squad')).toBeDefined()
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Login redirect                                                   */
  /* ---------------------------------------------------------------- */
  it('stores redirect URL and navigates to /auth on login click', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
    mockSupabaseSquadFound()
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Se connecter')).toBeDefined()
    })
    fireEvent.click(screen.getByText('Se connecter'))
    expect(setItemSpy).toHaveBeenCalledWith('redirectAfterAuth', '/join/ABC123')
    expect(mocks.navigate).toHaveBeenCalledWith('/auth')
    setItemSpy.mockRestore()
  })

  /* ---------------------------------------------------------------- */
  /*  Preview state – logged in                                        */
  /* ---------------------------------------------------------------- */
  it('shows "Rejoindre la squad" button when logged in', async () => {
    mocks.useAuthStore.mockReturnValue({ user: { id: 'u1' }, isInitialized: true })
    mockSupabaseSquadFound()
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Rejoindre la squad')).toBeDefined()
    })
  })

  /* ---------------------------------------------------------------- */
  /*  handleJoin – success                                             */
  /* ---------------------------------------------------------------- */
  it('shows success state on successful join', async () => {
    mocks.useAuthStore.mockReturnValue({ user: { id: 'u1' }, isInitialized: true })
    mocks.joinSquad.mockResolvedValue({ error: null })
    mockSupabaseSquadFound({ id: 'sq1', name: 'CoolSquad', game: 'Valorant' })
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Rejoindre la squad')).toBeDefined()
    })
    fireEvent.click(screen.getByText('Rejoindre la squad'))
    await waitFor(() => {
      expect(screen.getByText('Bienvenue dans la squad !')).toBeDefined()
    })
    expect(mocks.showSuccess).toHaveBeenCalledWith('Bienvenue dans CoolSquad !')
  })

  /* ---------------------------------------------------------------- */
  /*  handleJoin – already a member                                    */
  /* ---------------------------------------------------------------- */
  it('redirects to squad when already a member', async () => {
    mocks.useAuthStore.mockReturnValue({ user: { id: 'u1' }, isInitialized: true })
    mocks.joinSquad.mockResolvedValue({ error: { message: 'Tu fais déjà partie de cette squad' } })
    mockSupabaseSquadFound({ id: 'sq1', name: 'CoolSquad', game: 'Valorant' })
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Rejoindre la squad')).toBeDefined()
    })
    fireEvent.click(screen.getByText('Rejoindre la squad'))
    await waitFor(() => {
      expect(mocks.showSuccess).toHaveBeenCalledWith('Tu fais déjà partie de cette squad !')
    })
    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/squad/sq1', { replace: true })
    })
  })

  /* ---------------------------------------------------------------- */
  /*  handleJoin – error                                               */
  /* ---------------------------------------------------------------- */
  it('shows error state on join failure (non-Error object thrown)', async () => {
    // joinSquad returns { error: { message: '...' } } which is NOT instanceof Error
    // so the catch block falls through to generic message
    mocks.useAuthStore.mockReturnValue({ user: { id: 'u1' }, isInitialized: true })
    mocks.joinSquad.mockResolvedValue({ error: { message: 'Squad pleine' } })
    mockSupabaseSquadFound()
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Rejoindre la squad')).toBeDefined()
    })
    fireEvent.click(screen.getByText('Rejoindre la squad'))
    await waitFor(() => {
      expect(screen.getByText('Impossible de rejoindre la squad')).toBeDefined()
    })
    expect(mocks.showError).toHaveBeenCalledWith('Impossible de rejoindre la squad')
  })

  it('shows Error.message on join failure when Error is thrown', async () => {
    mocks.useAuthStore.mockReturnValue({ user: { id: 'u1' }, isInitialized: true })
    mocks.joinSquad.mockRejectedValue(new Error('Squad pleine'))
    mockSupabaseSquadFound()
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Rejoindre la squad')).toBeDefined()
    })
    fireEvent.click(screen.getByText('Rejoindre la squad'))
    await waitFor(() => {
      expect(screen.getByText('Squad pleine')).toBeDefined()
    })
    expect(mocks.showError).toHaveBeenCalledWith('Squad pleine')
  })

  it('shows generic error on non-Error throw', async () => {
    mocks.useAuthStore.mockReturnValue({ user: { id: 'u1' }, isInitialized: true })
    mocks.joinSquad.mockRejectedValue('unexpected')
    mockSupabaseSquadFound()
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Rejoindre la squad')).toBeDefined()
    })
    fireEvent.click(screen.getByText('Rejoindre la squad'))
    await waitFor(() => {
      expect(screen.getByText('Impossible de rejoindre la squad')).toBeDefined()
    })
    expect(mocks.showError).toHaveBeenCalledWith('Impossible de rejoindre la squad')
  })

  /* ---------------------------------------------------------------- */
  /*  Code uppercasing                                                 */
  /* ---------------------------------------------------------------- */
  it('uppercases the invite code when querying', async () => {
    mocks.useParams.mockReturnValue({ code: 'abc123' })
    const eqFn = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    })
    mocks.supabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqFn }),
    })
    render(<JoinSquad />)
    await waitFor(() => {
      expect(eqFn).toHaveBeenCalledWith('invite_code', 'ABC123')
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Success state rendering                                          */
  /* ---------------------------------------------------------------- */
  it('shows squad name in success state', async () => {
    mocks.useAuthStore.mockReturnValue({ user: { id: 'u1' }, isInitialized: true })
    mocks.joinSquad.mockResolvedValue({ error: null })
    mockSupabaseSquadFound({ id: 'sq1', name: 'MaSquad', game: 'X' })
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Rejoindre la squad')).toBeDefined()
    })
    fireEvent.click(screen.getByText('Rejoindre la squad'))
    await waitFor(() => {
      expect(screen.getByText('Tu fais maintenant partie de MaSquad')).toBeDefined()
    })
  })

  /* ---------------------------------------------------------------- */
  /*  No user means no join button                                     */
  /* ---------------------------------------------------------------- */
  it('does not show join button when not logged in', async () => {
    mockSupabaseSquadFound()
    render(<JoinSquad />)
    await waitFor(() => {
      expect(screen.getByText('Se connecter')).toBeDefined()
    })
    expect(screen.queryByText('Rejoindre la squad')).toBeNull()
  })

  /* ---------------------------------------------------------------- */
  /*  Back link in preview                                             */
  /* ---------------------------------------------------------------- */
  it('shows "Retour" link in preview state', async () => {
    mockSupabaseSquadFound()
    render(<JoinSquad />)
    await waitFor(() => {
      const links = screen.getAllByText("Retour à l'accueil")
      expect(links.length).toBeGreaterThan(0)
      expect(links[0].closest('a')?.getAttribute('href')).toBe('/')
    })
  })
})
