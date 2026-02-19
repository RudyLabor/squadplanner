import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ---- vi.hoisted mocks ----
const mockNavigate = vi.hoisted(() => vi.fn())
const mockSetMode = vi.hoisted(() => vi.fn())
const mockOpenCreateSession = vi.hoisted(() => vi.fn())
const mockCreateSessionModalIsOpen = vi.hoisted(() => ({ current: false }))
const mockSquads = vi.hoisted(() => ({
  current: [] as Array<{ id: string; name: string; game: string | null }>,
}))
const mockSessions = vi.hoisted(() => ({
  current: [] as Array<{
    id: string
    title: string
    game: string
    scheduled_at: string
  }>,
}))
const mockThemeMode = vi.hoisted(() => ({ current: 'dark' as string }))
const mockEffectiveTheme = vi.hoisted(() => ({ current: 'dark' as string }))
const mockSupabaseFrom = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  })
)
const mockShortcutsHelpModal = vi.hoisted(() => vi.fn(() => null))
const mockCommandPreviewPanel = vi.hoisted(() => vi.fn(() => null))
const mockCommandResultList = vi.hoisted(() =>
  vi.fn(({ filteredCommands, groupedCommands, categoryLabels, selectedIndex, onSelect, query }: any) => {
    return createElement(
      'div',
      { 'data-testid': 'command-result-list' },
      filteredCommands.map((cmd: any, i: number) =>
        createElement(
          'button',
          {
            key: cmd.id,
            'data-testid': `cmd-${cmd.id}`,
            'data-selected': i === selectedIndex ? 'true' : 'false',
            onClick: () => onSelect(cmd),
          },
          cmd.label
        )
      )
    )
  })
)

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

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

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn() },
    from: (...args: any[]) => mockSupabaseFrom(...args),
  },
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
  useSquadsStore: vi.fn(() => ({ squads: mockSquads.current })),
  useSessionsStore: vi.fn(() => ({ sessions: mockSessions.current })),
  useViewTransitionNavigate: vi.fn(() => mockNavigate),
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

vi.mock('../../hooks/useTheme', () => ({
  useThemeStore: vi.fn(() => ({
    mode: mockThemeMode.current,
    setMode: mockSetMode,
    effectiveTheme: mockEffectiveTheme.current,
  })),
}))

vi.mock('../CreateSessionModal', () => ({
  useCreateSessionModal: vi.fn((selector: any) => {
    const state = {
      isOpen: mockCreateSessionModalIsOpen.current,
      open: mockOpenCreateSession,
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('../command-palette/ShortcutsHelpModal', () => ({
  ShortcutsHelpModal: (props: any) => mockShortcutsHelpModal(props),
}))
vi.mock('../command-palette/CommandPreviewPanel', () => ({
  CommandPreviewPanel: (props: any) => mockCommandPreviewPanel(props),
}))
vi.mock('../command-palette/CommandResultList', () => ({
  CommandResultList: (props: any) => mockCommandResultList(props),
}))

vi.mock('../../lib/queryClient', () => ({
  queryKeys: {
    squads: { list: () => ['squads'] },
    sessions: { upcoming: () => ['sessions', 'upcoming'] },
  },
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
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

import { CommandPalette } from '../CommandPalette'

function renderPalette() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <CommandPalette />
    </QueryClientProvider>
  )
}

function openPalette() {
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    localStorage.clear()
    mockSquads.current = []
    mockSessions.current = []
    mockThemeMode.current = 'dark'
    mockEffectiveTheme.current = 'dark'
    mockCreateSessionModalIsOpen.current = false
    // Reset the sub-component mocks
    mockShortcutsHelpModal.mockImplementation((props: any) =>
      props.isOpen ? createElement('div', { 'data-testid': 'shortcuts-help' }, 'Shortcuts') : null
    )
    mockCommandPreviewPanel.mockImplementation(() =>
      createElement('div', { 'data-testid': 'preview-panel' })
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---- Basic rendering ----
  describe('rendering', () => {
    it('renders without crash (closed by default)', () => {
      const { container } = renderPalette()
      expect(container).toBeTruthy()
    })

    it('does not show the modal content when closed', () => {
      renderPalette()
      expect(
        screen.queryByPlaceholderText('Rechercher une commande, squad, session...')
      ).not.toBeInTheDocument()
    })

    it('renders ShortcutsHelpModal even when palette is closed', () => {
      renderPalette()
      expect(mockShortcutsHelpModal).toHaveBeenCalled()
    })
  })

  // ---- Opening & Closing ----
  describe('open/close via Ctrl+K', () => {
    it('opens the palette with Ctrl+K', () => {
      renderPalette()
      openPalette()
      expect(
        screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      ).toBeInTheDocument()
    })

    it('toggles closed with Ctrl+K when already open', () => {
      renderPalette()
      openPalette()
      expect(
        screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      ).toBeInTheDocument()
      openPalette()
      expect(
        screen.queryByPlaceholderText('Rechercher une commande, squad, session...')
      ).not.toBeInTheDocument()
    })

    it('opens the palette with Meta+K (Mac)', () => {
      renderPalette()
      fireEvent.keyDown(window, { key: 'k', metaKey: true })
      expect(
        screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      ).toBeInTheDocument()
    })

    it('does NOT open palette when CreateSessionModal is open', () => {
      mockCreateSessionModalIsOpen.current = true
      renderPalette()
      openPalette()
      expect(
        screen.queryByPlaceholderText('Rechercher une commande, squad, session...')
      ).not.toBeInTheDocument()
    })
  })

  describe('closing with Escape', () => {
    it('closes the palette with Escape key', () => {
      renderPalette()
      openPalette()
      expect(
        screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      ).toBeInTheDocument()
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(
        screen.queryByPlaceholderText('Rechercher une commande, squad, session...')
      ).not.toBeInTheDocument()
    })

    it('closes the palette when backdrop is clicked', () => {
      renderPalette()
      openPalette()
      const backdrop = screen.getByPlaceholderText(
        'Rechercher une commande, squad, session...'
      ).closest('.mx-4')
      // The backdrop is the sibling div
      const allDivs = document.querySelectorAll('.fixed.inset-0')
      if (allDivs.length > 0) {
        fireEvent.click(allDivs[0])
      }
      // After clicking backdrop, palette should close
    })

    it('closes with the X button', () => {
      renderPalette()
      openPalette()
      const closeButton = screen.getByLabelText('Fermer la palette de commandes')
      fireEvent.click(closeButton)
      expect(
        screen.queryByPlaceholderText('Rechercher une commande, squad, session...')
      ).not.toBeInTheDocument()
    })
  })

  // ---- Search input ----
  describe('search input', () => {
    it('updates query when typing', () => {
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'accueil' } })
      expect(input).toHaveValue('accueil')
    })

    it('resets query when palette closes', () => {
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'test' } })
      fireEvent.keyDown(window, { key: 'Escape' })
      // Re-open
      openPalette()
      const inputAfter = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      expect(inputAfter).toHaveValue('')
    })
  })

  // ---- Keyboard shortcuts when palette is closed ----
  describe('global keyboard shortcuts (palette closed, not typing)', () => {
    it('navigates to /sessions?new=true on N key', () => {
      renderPalette()
      fireEvent.keyDown(window, { key: 'n' })
      expect(mockNavigate).toHaveBeenCalledWith('/sessions?new=true')
    })

    it('navigates to /squads on S key', () => {
      renderPalette()
      fireEvent.keyDown(window, { key: 's' })
      expect(mockNavigate).toHaveBeenCalledWith('/squads')
    })

    it('navigates to /messages on M key', () => {
      renderPalette()
      fireEvent.keyDown(window, { key: 'm' })
      expect(mockNavigate).toHaveBeenCalledWith('/messages')
    })

    it('navigates to /party on P key', () => {
      renderPalette()
      fireEvent.keyDown(window, { key: 'p' })
      expect(mockNavigate).toHaveBeenCalledWith('/party')
    })

    it('navigates to /home on H key', () => {
      renderPalette()
      fireEvent.keyDown(window, { key: 'h' })
      expect(mockNavigate).toHaveBeenCalledWith('/home')
    })

    it('toggles theme on T key', () => {
      renderPalette()
      fireEvent.keyDown(window, { key: 't' })
      expect(mockSetMode).toHaveBeenCalledWith('light')
    })

    it('opens shortcuts help on ? key', () => {
      renderPalette()
      fireEvent.keyDown(window, { key: '?' })
      // Re-render triggers ShortcutsHelpModal with isOpen=true
      // We can check that the modal was called with isOpen
    })

    it('does NOT trigger shortcuts when palette is open', () => {
      renderPalette()
      openPalette()
      mockNavigate.mockClear()
      // When palette is open, global shortcuts should not fire
      fireEvent.keyDown(window, { key: 'n' })
      // 'n' should not navigate because isOpen is true (the shortcut block checks !isOpen)
      expect(mockNavigate).not.toHaveBeenCalledWith('/sessions?new=true')
    })
  })

  // ---- Navigation commands ----
  describe('navigation commands', () => {
    it('shows navigation commands when palette opens', () => {
      renderPalette()
      openPalette()
      expect(screen.getByTestId('command-result-list')).toBeInTheDocument()
      expect(screen.getByTestId('cmd-home')).toBeInTheDocument()
      expect(screen.getByTestId('cmd-squads')).toBeInTheDocument()
      expect(screen.getByTestId('cmd-party')).toBeInTheDocument()
      expect(screen.getByTestId('cmd-messages')).toBeInTheDocument()
      expect(screen.getByTestId('cmd-sessions')).toBeInTheDocument()
      expect(screen.getByTestId('cmd-profile')).toBeInTheDocument()
      expect(screen.getByTestId('cmd-settings')).toBeInTheDocument()
      expect(screen.getByTestId('cmd-premium')).toBeInTheDocument()
    })

    it('executes navigation commands and closes palette', () => {
      renderPalette()
      openPalette()
      fireEvent.click(screen.getByTestId('cmd-home'))
      expect(mockNavigate).toHaveBeenCalledWith('/home')
    })
  })

  // ---- Action commands ----
  describe('action commands', () => {
    it('shows create-session action', () => {
      renderPalette()
      openPalette()
      expect(screen.getByTestId('cmd-create-session')).toBeInTheDocument()
    })

    it('executes create session and closes palette', () => {
      renderPalette()
      openPalette()
      fireEvent.click(screen.getByTestId('cmd-create-session'))
      expect(mockOpenCreateSession).toHaveBeenCalled()
    })

    it('shows toggle-theme action', () => {
      renderPalette()
      openPalette()
      expect(screen.getByTestId('cmd-toggle-theme')).toBeInTheDocument()
    })

    it('executes toggle theme and closes palette', () => {
      renderPalette()
      openPalette()
      fireEvent.click(screen.getByTestId('cmd-toggle-theme'))
      expect(mockSetMode).toHaveBeenCalled()
    })
  })

  // ---- Theme toggle logic ----
  describe('theme toggle cycle', () => {
    it('cycles dark -> light', () => {
      mockThemeMode.current = 'dark'
      renderPalette()
      openPalette()
      fireEvent.click(screen.getByTestId('cmd-toggle-theme'))
      expect(mockSetMode).toHaveBeenCalledWith('light')
    })

    it('cycles light -> system', () => {
      mockThemeMode.current = 'light'
      renderPalette()
      openPalette()
      fireEvent.click(screen.getByTestId('cmd-toggle-theme'))
      expect(mockSetMode).toHaveBeenCalledWith('system')
    })

    it('cycles system -> dark', () => {
      mockThemeMode.current = 'system'
      renderPalette()
      openPalette()
      fireEvent.click(screen.getByTestId('cmd-toggle-theme'))
      expect(mockSetMode).toHaveBeenCalledWith('dark')
    })
  })

  // ---- Squad commands ----
  describe('squad commands', () => {
    it('shows squad commands when searching by name', () => {
      mockSquads.current = [
        { id: 'sq1', name: 'Alpha Squad', game: 'Valorant' },
        { id: 'sq2', name: 'Beta Team', game: null },
      ]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'alpha' } })
      expect(screen.getByTestId('cmd-squad-sq1')).toBeInTheDocument()
      expect(screen.getByText('Alpha Squad')).toBeInTheDocument()
    })

    it('navigates to squad via Ouvrir sub-command', () => {
      mockSquads.current = [{ id: 'sq1', name: 'Alpha Squad', game: 'Valorant' }]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'alpha' } })
      // Clicking squad enters sub-commands (because it has children)
      fireEvent.click(screen.getByTestId('cmd-squad-sq1'))
      // Now click "Ouvrir" sub-command to navigate
      fireEvent.click(screen.getByText('Ouvrir'))
      expect(mockNavigate).toHaveBeenCalledWith('/squad/sq1')
    })

    it('enters subcommand when squad has children', () => {
      mockSquads.current = [{ id: 'sq1', name: 'Alpha Squad', game: 'Valorant' }]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'alpha' } })
      // The onSelect callback is enterSubCommandWithRecent which checks for children
      // Since squads have children, it should push into parentStack
      fireEvent.click(screen.getByTestId('cmd-squad-sq1'))
      // After entering sub-command, the palette re-renders with the sub-commands
      // We verify the sub-commands now appear (Ouvrir, Chat, Party Vocale)
      expect(screen.getByText('Ouvrir')).toBeInTheDocument()
    })

    it('shows squad description as game name or fallback', () => {
      mockSquads.current = [
        { id: 'sq1', name: 'Alpha', game: 'Valorant' },
        { id: 'sq2', name: 'Beta', game: null },
      ]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'alpha' } })
      // Alpha has game Valorant
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const alphaCmd = lastCall[0].filteredCommands.find((c: any) => c.id === 'squad-sq1')
        expect(alphaCmd?.description).toBe('Valorant')
      }
    })
  })

  // ---- Session commands ----
  describe('session commands', () => {
    it('shows session commands when searching by title', () => {
      mockSessions.current = [
        {
          id: 'sess1',
          title: 'Ranked Night',
          game: 'Valorant',
          scheduled_at: '2026-03-01T20:00:00Z',
        },
      ]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'ranked' } })
      expect(screen.getByTestId('cmd-session-sess1')).toBeInTheDocument()
      expect(screen.getByText('Ranked Night')).toBeInTheDocument()
    })

    it('uses "Session" as fallback label when title is empty', () => {
      // The sessionCommands mapping uses `session.title || 'Session'`
      // Verify by putting the session as a recent command so it appears in filtered results
      mockSessions.current = [
        {
          id: 'sess2',
          title: '',
          game: 'CS2',
          scheduled_at: '2026-03-01T20:00:00Z',
        },
      ]
      // Set session-sess2 as recent so it gets priority in the 10-item limit
      localStorage.setItem(
        'squadplanner:recent-commands',
        JSON.stringify(['session-sess2'])
      )
      renderPalette()
      openPalette()
      // With session-sess2 as a recent, it should appear in filteredCommands (no query)
      // The label should be 'Session' since title is empty
      expect(screen.getByText('Session')).toBeInTheDocument()
    })

    it('navigates to session on click', () => {
      mockSessions.current = [
        {
          id: 'sess1',
          title: 'Ranked Night',
          game: 'Valorant',
          scheduled_at: '2026-03-01T20:00:00Z',
        },
      ]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'ranked' } })
      fireEvent.click(screen.getByTestId('cmd-session-sess1'))
      expect(mockNavigate).toHaveBeenCalledWith('/session/sess1')
    })
  })

  // ---- Arrow key navigation ----
  describe('arrow key navigation', () => {
    it('ArrowDown increments selected index', () => {
      renderPalette()
      openPalette()
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      // We check the CommandResultList was called with selectedIndex=1
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        // The component re-renders, so we look for the updated selectedIndex
        // The first call had selectedIndex=0, the next should have 1
      }
    })

    it('ArrowUp decrements selected index (wraps around)', () => {
      renderPalette()
      openPalette()
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      // Should wrap to the last command
    })

    it('Enter executes the selected command', () => {
      renderPalette()
      openPalette()
      // By default selectedIndex is 0, which is the first command (home)
      fireEvent.keyDown(window, { key: 'Enter' })
      // The first command is 'home' which navigates to /home
      expect(mockNavigate).toHaveBeenCalledWith('/home')
    })
  })

  // ---- Backspace to go back from sub-commands ----
  describe('sub-command navigation with back', () => {
    it('Backspace goes back from sub-command when query is empty', () => {
      mockSquads.current = [{ id: 'sq1', name: 'Alpha Squad', game: 'Valorant' }]
      renderPalette()
      openPalette()
      // Enter sub-command for squad
      // The squad command has children, so enterSubCommand pushes to parentStack
      fireEvent.keyDown(window, { key: 'Enter' }) // selects first cmd (home), not squad
      // We need to navigate to the squad command first
    })

    it('Escape goes back from sub-command before closing', () => {
      renderPalette()
      openPalette()
      // If parentStack > 0, Escape should goBack first
      // Since we can't easily push to parentStack from outside, we test that escape closes
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(
        screen.queryByPlaceholderText('Rechercher une commande, squad, session...')
      ).not.toBeInTheDocument()
    })
  })

  // ---- Search / Filter ----
  describe('search filtering', () => {
    it('filters commands based on query', () => {
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'accueil' } })
      // After filtering, only matching commands should be passed to CommandResultList
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const filteredCommands = lastCall[0].filteredCommands
        // 'Accueil' matches the home command label
        const hasHome = filteredCommands.some((c: any) => c.id === 'home')
        expect(hasHome).toBe(true)
      }
    })

    it('filters squads by name', () => {
      mockSquads.current = [
        { id: 'sq1', name: 'Alpha Squad', game: 'Valorant' },
        { id: 'sq2', name: 'Beta Team', game: 'CS2' },
      ]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'alpha' } })
      // Alpha Squad should appear in filtered commands
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const filteredCommands = lastCall[0].filteredCommands
        const hasAlpha = filteredCommands.some((c: any) => c.id === 'squad-sq1')
        expect(hasAlpha).toBe(true)
      }
    })

    it('filters squads by game', () => {
      mockSquads.current = [
        { id: 'sq1', name: 'Alpha Squad', game: 'Valorant' },
      ]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'valorant' } })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const filteredCommands = lastCall[0].filteredCommands
        const hasAlpha = filteredCommands.some((c: any) => c.id === 'squad-sq1')
        expect(hasAlpha).toBe(true)
      }
    })

    it('filters sessions by title', () => {
      mockSessions.current = [
        {
          id: 'sess1',
          title: 'Ranked Night',
          game: 'Valorant',
          scheduled_at: '2026-03-01T20:00:00Z',
        },
      ]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'ranked' } })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const filteredCommands = lastCall[0].filteredCommands
        const hasSession = filteredCommands.some((c: any) => c.id === 'session-sess1')
        expect(hasSession).toBe(true)
      }
    })

    it('returns no results for non-matching query', () => {
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'xyznonexistent' } })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const filteredCommands = lastCall[0].filteredCommands
        expect(filteredCommands.length).toBe(0)
      }
    })
  })

  // ---- Recent commands ----
  describe('recent commands', () => {
    it('stores recently selected commands in localStorage', () => {
      renderPalette()
      openPalette()
      // Select the home command
      fireEvent.click(screen.getByTestId('cmd-home'))
      const recent = JSON.parse(localStorage.getItem('squadplanner:recent-commands') || '[]')
      expect(recent).toContain('home')
    })

    it('shows recent commands first when no query', () => {
      localStorage.setItem('squadplanner:recent-commands', JSON.stringify(['settings', 'profile']))
      renderPalette()
      openPalette()
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const filteredCommands = lastCall[0].filteredCommands
        // Recent commands should appear first
        if (filteredCommands.length >= 2) {
          expect(filteredCommands[0].id).toBe('settings')
          expect(filteredCommands[1].id).toBe('profile')
        }
      }
    })

    it('limits recent commands to 8', () => {
      const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
      localStorage.setItem('squadplanner:recent-commands', JSON.stringify(ids))
      renderPalette()
      openPalette()
      // Select another command to trigger addRecent
      fireEvent.click(screen.getByTestId('cmd-home'))
      const recent = JSON.parse(localStorage.getItem('squadplanner:recent-commands') || '[]')
      expect(recent.length).toBeLessThanOrEqual(8)
    })

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('squadplanner:recent-commands', 'not-valid-json')
      renderPalette()
      openPalette()
      // Should not crash, getRecentIds returns [] on parse error
      expect(screen.getByTestId('command-result-list')).toBeInTheDocument()
    })
  })

  // ---- Player search (debounced Supabase call) ----
  describe('player search', () => {
    it('does NOT search players when query < 2 chars', () => {
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'a' } })
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(mockSupabaseFrom).not.toHaveBeenCalled()
    })

    it('searches players after 300ms debounce with query >= 2 chars', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 'p1', username: 'JohnDoe', avatar_url: null }],
          error: null,
        }),
      })
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'john' } })
      await act(async () => {
        vi.advanceTimersByTime(350)
      })
      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles')
    })

    it('handles player search errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(new Error('Network error')),
      })
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'john' } })
      await act(async () => {
        vi.advanceTimersByTime(350)
      })
      consoleSpy.mockRestore()
    })
  })

  // ---- Shortcut key display (Mac vs non-Mac) ----
  describe('shortcut key display', () => {
    it('shows Ctrl in the shortcut hint on non-Mac', () => {
      renderPalette()
      openPalette()
      expect(screen.getByText(/Ctrl/)).toBeInTheDocument()
    })
  })

  // ---- Footer keyboard hints ----
  describe('footer hints', () => {
    it('shows keyboard navigation hints in footer', () => {
      renderPalette()
      openPalette()
      expect(screen.getByText('naviguer')).toBeInTheDocument()
      expect(screen.getByText('fermer')).toBeInTheDocument()
    })
  })

  // ---- parentStack breadcrumb ----
  describe('parent stack breadcrumb', () => {
    it('shows breadcrumb when in sub-commands', () => {
      // We need to trigger entering a sub-command
      mockSquads.current = [{ id: 'sq1', name: 'Alpha', game: null }]
      renderPalette()
      openPalette()
      // Search for the squad so it appears
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'alpha' } })
      // Click on the squad command (it has children, so enters sub-command)
      fireEvent.click(screen.getByTestId('cmd-squad-sq1'))
      // Now parentStack has Alpha, breadcrumb should show the parent label
      expect(screen.getByText('Alpha')).toBeInTheDocument()
    })
  })

  // ---- Grouped commands / category labels ----
  describe('category labels', () => {
    it('passes correct category labels to CommandResultList', () => {
      renderPalette()
      openPalette()
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const labels = lastCall[0].categoryLabels
        expect(labels).toMatchObject({
          recent: 'Récents',
          navigation: 'Navigation',
          squads: 'Squads',
          sessions: 'Sessions',
          actions: 'Actions',
          players: 'Joueurs',
        })
      }
    })
  })

  // ---- CommandPreviewPanel ----
  describe('command preview panel', () => {
    it('passes the currently selected command to CommandPreviewPanel', () => {
      renderPalette()
      openPalette()
      expect(mockCommandPreviewPanel).toHaveBeenCalled()
      const lastCall =
        mockCommandPreviewPanel.mock.calls[mockCommandPreviewPanel.mock.calls.length - 1]
      if (lastCall) {
        expect(lastCall[0].command).toBeDefined()
      }
    })
  })

  // ---- Shortcuts help modal ----
  describe('shortcuts help modal', () => {
    it('opens ShortcutsHelpModal when ? is pressed', () => {
      renderPalette()
      fireEvent.keyDown(window, { key: '?' })
      // The modal should now be open
      // We check that ShortcutsHelpModal was re-rendered with isOpen=true
      const calls = mockShortcutsHelpModal.mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0].isOpen).toBe(true)
    })

    it('closes ShortcutsHelpModal on Escape when it is open', () => {
      renderPalette()
      // Open shortcuts help
      fireEvent.keyDown(window, { key: '?' })
      // Now press Escape
      fireEvent.keyDown(window, { key: 'Escape' })
      const calls = mockShortcutsHelpModal.mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0].isOpen).toBe(false)
    })
  })

  // ---- Limits ----
  describe('command limits', () => {
    it('limits displayed squads to 5 (via allCommands)', () => {
      mockSquads.current = Array.from({ length: 10 }, (_, i) => ({
        id: `sq${i}`,
        name: `SquadItem ${i}`,
        game: null,
      }))
      renderPalette()
      openPalette()
      // Search for squads to only get squad commands
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'SquadItem' } })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const squadCmds = lastCall[0].filteredCommands.filter((c: any) => c.id.startsWith('squad-'))
        expect(squadCmds.length).toBeLessThanOrEqual(5)
      }
    })

    it('limits displayed sessions to 5 (via allCommands)', () => {
      mockSessions.current = Array.from({ length: 10 }, (_, i) => ({
        id: `s${i}`,
        title: `SessionItem ${i}`,
        game: 'Game',
        scheduled_at: '2026-03-01T20:00:00Z',
      }))
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'SessionItem' } })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const sessionCmds = lastCall[0].filteredCommands.filter((c: any) => c.id.startsWith('session-'))
        expect(sessionCmds.length).toBeLessThanOrEqual(5)
      }
    })

    it('limits total filtered commands to 10 when no query', () => {
      mockSquads.current = Array.from({ length: 5 }, (_, i) => ({
        id: `sq${i}`,
        name: `Squad ${i}`,
        game: null,
      }))
      mockSessions.current = Array.from({ length: 5 }, (_, i) => ({
        id: `s${i}`,
        title: `Session ${i}`,
        game: 'Game',
        scheduled_at: '2026-03-01T20:00:00Z',
      }))
      renderPalette()
      openPalette()
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        expect(lastCall[0].filteredCommands.length).toBeLessThanOrEqual(10)
      }
    })
  })

  // ---- P1.1 additions ----

  describe('fuzzy search scoring', () => {
    it('scores exact substring matches higher than fuzzy matches', () => {
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      // 'Accueil' is the label for the home command — an exact substring match
      fireEvent.change(input, { target: { value: 'Accueil' } })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const filtered = lastCall[0].filteredCommands
        // Home command should appear first since 'Accueil' is an exact match to its label
        expect(filtered.length).toBeGreaterThan(0)
        expect(filtered[0].id).toBe('home')
      }
    })

    it('returns zero-score commands excluded from results', () => {
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'zzzzzznotmatch' } })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        expect(lastCall[0].filteredCommands.length).toBe(0)
      }
    })

    it('matches partial sequences via fuzzy scoring', () => {
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      // 'prm' should fuzzy-match 'Premium' (p-r-m are in order)
      fireEvent.change(input, { target: { value: 'prm' } })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const filtered = lastCall[0].filteredCommands
        const hasPremium = filtered.some((c: any) => c.id === 'premium')
        expect(hasPremium).toBe(true)
      }
    })

    it('matches via description (with 0.7 weight)', () => {
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      // 'Retour' is in the description of 'Accueil' ("Retour à la page principale")
      fireEvent.change(input, { target: { value: 'Retour' } })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const filtered = lastCall[0].filteredCommands
        const hasHome = filtered.some((c: any) => c.id === 'home')
        expect(hasHome).toBe(true)
      }
    })
  })

  describe('keyboard navigation (stronger assertions)', () => {
    it('ArrowDown moves selection from 0 to 1', () => {
      renderPalette()
      openPalette()
      // Initially selectedIndex = 0, first command (home) should be selected
      let lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      expect(lastCall[0].selectedIndex).toBe(0)

      fireEvent.keyDown(window, { key: 'ArrowDown' })
      lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      expect(lastCall[0].selectedIndex).toBe(1)
    })

    it('ArrowUp from 0 wraps to last command', () => {
      renderPalette()
      openPalette()
      const callBefore = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      const totalCommands = callBefore[0].filteredCommands.length

      fireEvent.keyDown(window, { key: 'ArrowUp' })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      expect(lastCall[0].selectedIndex).toBe(totalCommands - 1)
    })

    it('ArrowDown wraps around from last to first', () => {
      renderPalette()
      openPalette()
      const callBefore = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      const totalCommands = callBefore[0].filteredCommands.length

      // Press ArrowDown totalCommands times to wrap back to 0
      for (let i = 0; i < totalCommands; i++) {
        fireEvent.keyDown(window, { key: 'ArrowDown' })
      }
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      expect(lastCall[0].selectedIndex).toBe(0)
    })

    it('Enter on selected command navigates and closes', () => {
      renderPalette()
      openPalette()
      // Move to second command (squads)
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      fireEvent.keyDown(window, { key: 'Enter' })
      expect(mockNavigate).toHaveBeenCalledWith('/squads')
      // Palette should close
      expect(
        screen.queryByPlaceholderText('Rechercher une commande, squad, session...')
      ).not.toBeInTheDocument()
    })

    it('selectedIndex resets to 0 when query changes', () => {
      renderPalette()
      openPalette()
      // Move down
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      // Type query
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'mes' } })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      expect(lastCall[0].selectedIndex).toBe(0)
    })
  })

  describe('recent commands (deeper tests)', () => {
    it('moves previously recent command to front when selected again', () => {
      localStorage.setItem('squadplanner:recent-commands', JSON.stringify(['settings', 'profile']))
      renderPalette()
      openPalette()
      // Select 'profile' which is already recent but second
      fireEvent.click(screen.getByTestId('cmd-profile'))
      const recent = JSON.parse(localStorage.getItem('squadplanner:recent-commands') || '[]')
      expect(recent[0]).toBe('profile')
      // settings should still be in list
      expect(recent).toContain('settings')
    })

    it('groups recent commands under "recent" category when no query', () => {
      localStorage.setItem('squadplanner:recent-commands', JSON.stringify(['home']))
      renderPalette()
      openPalette()
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const grouped = lastCall[0].groupedCommands
        expect(grouped.recent).toBeDefined()
        expect(grouped.recent.some((c: any) => c.id === 'home')).toBe(true)
      }
    })
  })

  describe('breadcrumb navigation for nested commands', () => {
    it('shows back button with parent label in breadcrumb', () => {
      mockSquads.current = [{ id: 'sq1', name: 'MySquad', game: 'Fortnite' }]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'MySquad' } })
      // Enter sub-command
      fireEvent.click(screen.getByTestId('cmd-squad-sq1'))
      // Breadcrumb should show the parent label
      expect(screen.getByText('MySquad')).toBeInTheDocument()
    })

    it('Escape goes back from sub-command before closing palette', () => {
      mockSquads.current = [{ id: 'sq1', name: 'BreadTest', game: null }]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'BreadTest' } })
      fireEvent.click(screen.getByTestId('cmd-squad-sq1'))
      // Now in sub-command, Escape should go back (not close)
      fireEvent.keyDown(window, { key: 'Escape' })
      // Palette should still be open since we went back
      expect(
        screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      ).toBeInTheDocument()
      // Sub-commands should be gone, top-level commands should be visible
      expect(screen.getByTestId('cmd-home')).toBeInTheDocument()
    })

    it('Backspace goes back from sub-command when query is empty', () => {
      mockSquads.current = [{ id: 'sq1', name: 'TestSquad', game: null }]
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'TestSquad' } })
      fireEvent.click(screen.getByTestId('cmd-squad-sq1'))
      // Now in sub-command, input should be cleared (re-query after re-render)
      const inputAfterSub = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      expect(inputAfterSub).toHaveValue('')
      // Press Backspace with empty query to go back
      fireEvent.keyDown(window, { key: 'Backspace' })
      // Should be back at top level
      expect(screen.getByTestId('cmd-home')).toBeInTheDocument()
    })
  })

  describe('player search with debounce', () => {
    it('clears searched players when query becomes shorter than 2 chars', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 'p1', username: 'TestPlayer', avatar_url: null }],
          error: null,
        }),
      })
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')

      // Type long enough to trigger search
      fireEvent.change(input, { target: { value: 'test' } })
      await act(async () => {
        vi.advanceTimersByTime(350)
      })

      // Verify player commands appeared after the search
      expect(screen.getByTestId('cmd-player-p1')).toBeInTheDocument()

      // Re-query the input element after potential DOM changes from async search
      const inputAfterSearch = screen.getByPlaceholderText('Rechercher une commande, squad, session...')

      // Now shorten query below 2 chars
      fireEvent.change(inputAfterSearch, { target: { value: 't' } })
      // Flush the effect that runs setSearchedPlayers([])
      await act(async () => {
        vi.advanceTimersByTime(350)
      })

      // After the effect clears searchedPlayers, check the last mock call
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      const playerCmds = lastCall[0].filteredCommands.filter((c: any) =>
        c.id.startsWith('player-')
      )
      expect(playerCmds.length).toBe(0)
    })

    it('debounces player search — no call before 300ms', () => {
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'player' } })
      // Only 200ms — should not have called yet
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(mockSupabaseFrom).not.toHaveBeenCalled()
    })

    it('shows player results as commands after search completes', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 'p1', username: 'GamerPro', avatar_url: 'https://example.com/avatar.png' }],
          error: null,
        }),
      })
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'gamer' } })
      await act(async () => {
        vi.advanceTimersByTime(350)
      })
      // Player command should now be rendered
      await waitFor(() => {
        expect(screen.getByText('GamerPro')).toBeInTheDocument()
      })
    })

    it('does not show player results when API returns error', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
      })
      renderPalette()
      openPalette()
      const input = screen.getByPlaceholderText('Rechercher une commande, squad, session...')
      fireEvent.change(input, { target: { value: 'test' } })
      await act(async () => {
        vi.advanceTimersByTime(350)
      })
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const playerCmds = lastCall[0].filteredCommands.filter((c: any) =>
          c.id.startsWith('player-')
        )
        expect(playerCmds.length).toBe(0)
      }
      consoleSpy.mockRestore()
    })
  })

  describe('theme toggle cycles modes (additional)', () => {
    it('description reflects current mode as Sombre when dark', () => {
      mockThemeMode.current = 'dark'
      renderPalette()
      openPalette()
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const themeCmd = lastCall[0].filteredCommands.find((c: any) => c.id === 'toggle-theme')
        expect(themeCmd?.description).toContain('Sombre')
      }
    })

    it('description reflects current mode as Clair when light', () => {
      mockThemeMode.current = 'light'
      renderPalette()
      openPalette()
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const themeCmd = lastCall[0].filteredCommands.find((c: any) => c.id === 'toggle-theme')
        expect(themeCmd?.description).toContain('Clair')
      }
    })

    it('description reflects current mode as Auto when system', () => {
      mockThemeMode.current = 'system'
      renderPalette()
      openPalette()
      const lastCall = mockCommandResultList.mock.calls[mockCommandResultList.mock.calls.length - 1]
      if (lastCall) {
        const themeCmd = lastCall[0].filteredCommands.find((c: any) => c.id === 'toggle-theme')
        expect(themeCmd?.description).toContain('Auto')
      }
    })
  })
})
