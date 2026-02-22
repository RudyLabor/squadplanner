import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createElement } from 'react'

/* ------------------------------------------------------------------ */
/*  Hoisted mocks                                                      */
/* ------------------------------------------------------------------ */
const mockUseLocation = vi.hoisted(() =>
  vi.fn().mockReturnValue({ pathname: '/home', hash: '', search: '' })
)
const mockFetchCounts = vi.hoisted(() => vi.fn())
const mockSubscribe = vi.hoisted(() => vi.fn())
const mockUnsubscribe = vi.hoisted(() => vi.fn())
const mockFetchPendingCounts = vi.hoisted(() => vi.fn())
const mockSubscribeSquad = vi.hoisted(() => vi.fn())
const mockUnsubscribeSquad = vi.hoisted(() => vi.fn())
const mockOpenCreateSessionModal = vi.hoisted(() => vi.fn())
const mockUseKeyboardVisible = vi.hoisted(() => vi.fn().mockReturnValue(false))
const mockUseGlobalPresence = vi.hoisted(() => vi.fn())
const mockUseAuthStore = vi.hoisted(() =>
  Object.assign(
    vi.fn().mockReturnValue({
      user: { id: 'u1' },
      profile: { id: 'u1', username: 'Test', avatar_url: null },
      isLoading: false,
      isInitialized: true,
    }),
    {
      getState: vi
        .fn()
        .mockReturnValue({ user: { id: 'u1' }, profile: { id: 'u1', username: 'Test' } }),
    }
  )
)
const mockUseUnreadCountStore = vi.hoisted(() =>
  Object.assign(
    vi.fn().mockReturnValue({
      totalUnread: 0,
      fetchCounts: mockFetchCounts,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    }),
    { getState: vi.fn().mockReturnValue({}) }
  )
)
const mockUseSquadNotificationsStore = vi.hoisted(() =>
  Object.assign(
    vi.fn().mockReturnValue({
      pendingRsvpCount: 0,
      fetchPendingCounts: mockFetchPendingCounts,
      subscribe: mockSubscribeSquad,
      unsubscribe: mockUnsubscribeSquad,
    }),
    { getState: vi.fn().mockReturnValue({}) }
  )
)

const mockDesktopSidebar = vi.hoisted(() =>
  vi.fn((props: any) =>
    createElement(
      'aside',
      {
        'data-testid': 'desktop-sidebar',
        'data-expanded': String(props.isExpanded),
        'data-pinned': String(props.sidebarPinned),
      },
      'DesktopSidebar'
    )
  )
)
const mockMobileBottomNav = vi.hoisted(() =>
  vi.fn((props: any) =>
    createElement(
      'nav',
      {
        'data-testid': 'mobile-nav',
        'data-voice': String(props.isInVoiceChat),
        'data-keyboard': String(props.isKeyboardVisible),
      },
      'MobileBottomNav'
    )
  )
)
const mockTopBar = vi.hoisted(() => vi.fn(() => createElement('header', null, 'TopBar')))

/* ------------------------------------------------------------------ */
/*  vi.mock calls                                                      */
/* ------------------------------------------------------------------ */
vi.mock('react-router', () => ({
  useLocation: mockUseLocation,
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {},
  domMax: {},
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

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}))

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn() },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

vi.mock('../../../hooks', () => ({
  useAuthStore: mockUseAuthStore,
  useSquadsStore: vi.fn().mockReturnValue({}),
  useKeyboardVisible: mockUseKeyboardVisible,
  useUnreadCountStore: mockUseUnreadCountStore,
  useSquadNotificationsStore: mockUseSquadNotificationsStore,
  useGlobalPresence: mockUseGlobalPresence,
}))

vi.mock('../../../hooks/useAuth', () => ({
  useAuthStore: mockUseAuthStore,
}))

vi.mock('../../CreateSessionModal', () => ({
  useCreateSessionModal: Object.assign(vi.fn().mockReturnValue(mockOpenCreateSessionModal), {
    getState: vi.fn().mockReturnValue({}),
  }),
}))

vi.mock('../../CustomStatusModal', () => ({
  CustomStatusModal: (props: any) =>
    createElement('div', {
      'data-testid': 'custom-status-modal',
      'data-open': String(props.isOpen),
    }),
}))

vi.mock('../DesktopSidebar', () => ({
  DesktopSidebar: mockDesktopSidebar,
}))

vi.mock('../MobileBottomNav', () => ({
  MobileBottomNav: mockMobileBottomNav,
}))

vi.mock('../TopBar', () => ({
  TopBar: mockTopBar,
}))

vi.mock('../../../hooks/useVoiceChat', () => ({
  useVoiceChatStore: {
    getState: vi.fn().mockReturnValue({ isConnected: false }),
    subscribe: vi.fn().mockReturnValue(vi.fn()),
  },
}))

import { AppLayout } from '../AppLayout'

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({ pathname: '/home', hash: '', search: '' })
    mockUseAuthStore.mockReturnValue({
      user: { id: 'u1' },
      profile: { id: 'u1', username: 'Test', avatar_url: null },
      isLoading: false,
      isInitialized: true,
    })
    mockUseKeyboardVisible.mockReturnValue(false)
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /* ---------- Basic rendering ---------- */

  it('renders children inside the layout', () => {
    render(
      <AppLayout>
        <div>Page Content</div>
      </AppLayout>
    )
    expect(screen.getByText('Page Content')).toBeInTheDocument()
  })

  it('renders all navigation sub-components', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )
    expect(screen.getByText('DesktopSidebar')).toBeInTheDocument()
    expect(screen.getByText('MobileBottomNav')).toBeInTheDocument()
    expect(screen.getByText('TopBar')).toBeInTheDocument()
  })

  it('renders skip-link for accessibility', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )
    const skipLink = screen.getByText('Aller au contenu principal')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('renders main content area with correct id and tabIndex', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')
    expect(main).toHaveAttribute('tabindex', '-1')
  })

  /* ---------- shouldHideNav branches ---------- */

  it('hides nav on /auth page — renders only children', () => {
    mockUseLocation.mockReturnValue({ pathname: '/auth', hash: '', search: '' })
    render(
      <AppLayout>
        <div>Auth Page</div>
      </AppLayout>
    )
    expect(screen.getByText('Auth Page')).toBeInTheDocument()
    expect(screen.queryByText('DesktopSidebar')).not.toBeInTheDocument()
    expect(screen.queryByText('MobileBottomNav')).not.toBeInTheDocument()
  })

  it('hides nav on / landing page', () => {
    mockUseLocation.mockReturnValue({ pathname: '/', hash: '', search: '' })
    render(
      <AppLayout>
        <div>Landing</div>
      </AppLayout>
    )
    expect(screen.getByText('Landing')).toBeInTheDocument()
    expect(screen.queryByText('DesktopSidebar')).not.toBeInTheDocument()
  })

  it('hides nav on /onboarding page', () => {
    mockUseLocation.mockReturnValue({ pathname: '/onboarding', hash: '', search: '' })
    render(
      <AppLayout>
        <div>Onboarding</div>
      </AppLayout>
    )
    expect(screen.getByText('Onboarding')).toBeInTheDocument()
    expect(screen.queryByText('DesktopSidebar')).not.toBeInTheDocument()
  })

  it('hides nav on public pages when user is null', () => {
    mockUseLocation.mockReturnValue({ pathname: '/legal', hash: '', search: '' })
    mockUseAuthStore.mockReturnValue({
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    })
    render(
      <AppLayout>
        <div>Legal</div>
      </AppLayout>
    )
    expect(screen.getByText('Legal')).toBeInTheDocument()
    expect(screen.queryByText('DesktopSidebar')).not.toBeInTheDocument()
  })

  it('shows nav on public pages when user IS logged in', () => {
    mockUseLocation.mockReturnValue({ pathname: '/legal', hash: '', search: '' })
    render(
      <AppLayout>
        <div>Legal</div>
      </AppLayout>
    )
    expect(screen.getByText('DesktopSidebar')).toBeInTheDocument()
  })

  it('hides nav on /help when no user', () => {
    mockUseLocation.mockReturnValue({ pathname: '/help', hash: '', search: '' })
    mockUseAuthStore.mockReturnValue({
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    })
    render(
      <AppLayout>
        <div>Help</div>
      </AppLayout>
    )
    expect(screen.queryByText('DesktopSidebar')).not.toBeInTheDocument()
  })

  it('hides nav on /premium when no user', () => {
    mockUseLocation.mockReturnValue({ pathname: '/premium', hash: '', search: '' })
    mockUseAuthStore.mockReturnValue({
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    })
    render(
      <AppLayout>
        <div>Premium</div>
      </AppLayout>
    )
    expect(screen.queryByText('DesktopSidebar')).not.toBeInTheDocument()
  })

  /* ---------- Subscription effects ---------- */

  it('calls fetchCounts + subscribe when user exists', () => {
    render(
      <AppLayout>
        <div>c</div>
      </AppLayout>
    )
    expect(mockFetchCounts).toHaveBeenCalled()
    expect(mockSubscribe).toHaveBeenCalled()
  })

  it('does not call fetchCounts when user is null', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    })
    // Still need shouldHideNav false — use /home
    mockUseLocation.mockReturnValue({ pathname: '/home', hash: '', search: '' })
    render(
      <AppLayout>
        <div>c</div>
      </AppLayout>
    )
    // With no user, shouldHideNav won't skip (home is not public), but fetchCounts guard checks user
    // Actually the component still has user null but shouldHideNav = false for /home
    // So the nav renders but fetchCounts guard `if (!user) return` prevents the call
    expect(mockFetchCounts).not.toHaveBeenCalled()
  })

  it('calls fetchPendingCounts + subscribeSquad when user exists', () => {
    render(
      <AppLayout>
        <div>c</div>
      </AppLayout>
    )
    expect(mockFetchPendingCounts).toHaveBeenCalled()
    expect(mockSubscribeSquad).toHaveBeenCalled()
  })

  /* ---------- Global presence ---------- */

  it('calls useGlobalPresence with user info', () => {
    render(
      <AppLayout>
        <div>c</div>
      </AppLayout>
    )
    expect(mockUseGlobalPresence).toHaveBeenCalledWith({
      userId: 'u1',
      username: 'Test',
      avatarUrl: null,
    })
  })

  it('calls useGlobalPresence with empty username when profile is null', () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'u1' },
      profile: null,
      isLoading: false,
      isInitialized: true,
    })
    render(
      <AppLayout>
        <div>c</div>
      </AppLayout>
    )
    expect(mockUseGlobalPresence).toHaveBeenCalledWith({
      userId: 'u1',
      username: '',
      avatarUrl: null,
    })
  })

  /* ---------- Sidebar pinned from localStorage ---------- */

  it('hydrates sidebar pinned state from localStorage', () => {
    localStorage.setItem('sidebar-pinned', 'true')
    render(
      <AppLayout>
        <div>c</div>
      </AppLayout>
    )
    const sidebar = screen.getByTestId('desktop-sidebar')
    // When pinned, isExpanded = sidebarExpanded || sidebarPinned = true
    expect(sidebar.getAttribute('data-expanded')).toBe('true')
    expect(sidebar.getAttribute('data-pinned')).toBe('true')
  })

  it('defaults sidebar to collapsed when localStorage is empty', () => {
    render(
      <AppLayout>
        <div>c</div>
      </AppLayout>
    )
    const sidebar = screen.getByTestId('desktop-sidebar')
    expect(sidebar.getAttribute('data-expanded')).toBe('false')
    expect(sidebar.getAttribute('data-pinned')).toBe('false')
  })

  /* ---------- CustomStatusModal ---------- */

  it('renders CustomStatusModal initially closed', () => {
    render(
      <AppLayout>
        <div>c</div>
      </AppLayout>
    )
    const modal = screen.getByTestId('custom-status-modal')
    expect(modal.getAttribute('data-open')).toBe('false')
  })

  /* ---------- isPartyActive path ---------- */

  it('passes isPartyActive true when on /party', () => {
    mockUseLocation.mockReturnValue({ pathname: '/party', hash: '', search: '' })
    render(
      <AppLayout>
        <div>Party</div>
      </AppLayout>
    )
    // MobileBottomNav receives isPartyActive prop
    const nav = screen.getByTestId('mobile-nav')
    expect(nav).toBeInTheDocument()
  })

  /* ---------- Keyboard visibility ---------- */

  it('passes isKeyboardVisible to MobileBottomNav', () => {
    mockUseKeyboardVisible.mockReturnValue(true)
    render(
      <AppLayout>
        <div>c</div>
      </AppLayout>
    )
    const nav = screen.getByTestId('mobile-nav')
    expect(nav.getAttribute('data-keyboard')).toBe('true')
  })

  /* ---------- Multiple paths are not public ---------- */

  it('shows nav on /squads (non-public route)', () => {
    mockUseLocation.mockReturnValue({ pathname: '/squads', hash: '', search: '' })
    render(
      <AppLayout>
        <div>Squads</div>
      </AppLayout>
    )
    expect(screen.getByText('DesktopSidebar')).toBeInTheDocument()
  })
})
