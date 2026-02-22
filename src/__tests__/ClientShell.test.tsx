import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// --- Hoist all mock variables ---
const mockInitialize = vi.hoisted(() => vi.fn())
const mockUser = vi.hoisted(() => ({
  id: 'user-1',
  email: 'test@test.com',
  created_at: '2025-01-01',
  user_metadata: { username: 'tester', premium: false },
}))
const mockUseAuthStore = vi.hoisted(() =>
  vi.fn().mockReturnValue({ initialize: mockInitialize, user: null })
)

// --- Mock all dependencies ---

// react-router
vi.mock('react-router', () => ({
  Outlet: () => createElement('div', { 'data-testid': 'outlet' }, 'Outlet'),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLocation: vi.fn().mockReturnValue({ pathname: '/', search: '' }),
}))

// hooks barrel
vi.mock('../hooks', () => ({
  useAuthStore: mockUseAuthStore,
  usePushNotificationStore: Object.assign(vi.fn().mockReturnValue({}), {
    getState: vi.fn().mockReturnValue({
      isSupported: false,
      isSubscribed: false,
      subscribeToPush: vi.fn(),
    }),
  }),
  initializePushNotifications: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../lib/errorTracker', () => ({
  initErrorTracker: vi.fn(),
  setUser: vi.fn(),
}))

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}))

vi.mock('../hooks/useScrollRestoration', () => ({
  useScrollRestoration: vi.fn(),
}))

vi.mock('../hooks/useSwipeBack', () => ({
  useSwipeBack: vi.fn(),
}))

vi.mock('../hooks/useSessionExpiry', () => ({
  useSessionExpiry: vi.fn().mockReturnValue({
    showModal: false,
    dismissModal: vi.fn(),
  }),
}))

vi.mock('../hooks/useRateLimit', () => ({
  useRateLimitStore: vi.fn().mockReturnValue({
    isRateLimited: false,
    retryAfter: 0,
    dismiss: vi.fn(),
    reset: vi.fn(),
  }),
}))

vi.mock('../hooks/usePWAInstall', () => ({
  usePWAInstallStore: Object.assign(vi.fn().mockReturnValue({}), {
    getState: vi.fn().mockReturnValue({
      setDeferredPrompt: vi.fn(),
    }),
  }),
}))

vi.mock('../hooks/useNavigationProgress', () => ({
  useNavigationProgress: vi.fn(),
}))

vi.mock('../utils/trackEvent', () => ({
  initTrackingListeners: vi.fn(),
}))

vi.mock('../utils/analytics', () => ({
  trackPageView: vi.fn(),
  identifyUser: vi.fn(),
}))

vi.mock('../utils/routePrefetch', () => ({
  prefetchProbableRoutes: vi.fn(),
}))

vi.mock('../hooks/useVoiceCall', () => ({
  useVoiceCallStore: Object.assign(vi.fn(), {
    getState: vi.fn().mockReturnValue({
      status: 'idle',
      setIncomingCall: vi.fn(),
    }),
  }),
  subscribeToIncomingCalls: vi.fn().mockReturnValue(vi.fn()),
}))

vi.mock('../lib/supabaseMinimal', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { username: 'caller', avatar_url: null },
          }),
        }),
      }),
    }),
  },
}))

// Mock lazy-loaded components as simple stubs
vi.mock('../components/CallModal', () => ({
  CallModal: () => createElement('div', { 'data-testid': 'call-modal' }),
}))
vi.mock('../components/IncomingCallModal', () => ({
  IncomingCallModal: () => createElement('div', { 'data-testid': 'incoming-call-modal' }),
}))
vi.mock('../components/CommandPalette', () => ({
  CommandPalette: () => createElement('div', { 'data-testid': 'command-palette' }),
}))
vi.mock('../components/CreateSessionModal', () => ({
  CreateSessionModal: () => createElement('div', { 'data-testid': 'create-session-modal' }),
}))
vi.mock('../components/OfflineBanner', () => ({
  OfflineBanner: () => createElement('div', { 'data-testid': 'offline-banner' }),
}))
vi.mock('../components/SessionExpiredModal', () => ({
  SessionExpiredModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? createElement('div', { 'data-testid': 'session-expired-modal' }) : null,
}))
vi.mock('../components/RateLimitBanner', () => ({
  RateLimitBanner: () => createElement('div', { 'data-testid': 'rate-limit-banner' }),
}))
vi.mock('../components/PWAInstallBanner', () => ({
  PWAInstallBanner: () => createElement('div', { 'data-testid': 'pwa-banner' }),
}))
vi.mock('../components/NotificationBanner', () => ({
  default: () => createElement('div', { 'data-testid': 'notification-banner' }),
}))
vi.mock('../components/CookieConsent', () => ({
  CookieConsent: () => createElement('div', { 'data-testid': 'cookie-consent' }),
}))
vi.mock('../components/TourGuide', () => ({
  TourGuide: () => createElement('div', { 'data-testid': 'tour-guide' }),
}))
vi.mock('../components/ui/TopLoadingBar', () => ({
  TopLoadingBar: () => createElement('div', { 'data-testid': 'top-loading-bar' }),
}))
vi.mock('../components/layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) =>
    createElement('div', { 'data-testid': 'app-layout' }, children),
}))

import ClientShell from '../ClientShell'

describe('ClientShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthStore.mockReturnValue({ initialize: mockInitialize, user: null })
  })

  describe('core rendering', () => {
    it('renders without crashing', () => {
      render(<ClientShell />)
      expect(screen.getByTestId('top-loading-bar')).toBeInTheDocument()
    })

    it('renders TopLoadingBar', () => {
      render(<ClientShell />)
      expect(screen.getByTestId('top-loading-bar')).toBeInTheDocument()
    })

    it('renders AppLayout with Outlet', () => {
      render(<ClientShell />)
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
      expect(screen.getByTestId('outlet')).toBeInTheDocument()
    })

    it('renders shell banners (offline, PWA, cookie, tour)', async () => {
      render(<ClientShell />)
      // These are wrapped in Suspense with lazy, so they should appear
      expect(await screen.findByTestId('offline-banner')).toBeInTheDocument()
      expect(await screen.findByTestId('pwa-banner')).toBeInTheDocument()
      expect(await screen.findByTestId('cookie-consent')).toBeInTheDocument()
      expect(await screen.findByTestId('tour-guide')).toBeInTheDocument()
    })
  })

  describe('initialization effects', () => {
    it('calls initialize on mount', () => {
      render(<ClientShell />)
      expect(mockInitialize).toHaveBeenCalled()
    })

    it('calls initTrackingListeners on mount', async () => {
      const { initTrackingListeners } = await import('../utils/trackEvent')
      render(<ClientShell />)
      expect(initTrackingListeners).toHaveBeenCalled()
    })

    it('calls initializePushNotifications on mount', async () => {
      const { initializePushNotifications } = await import('../hooks')
      render(<ClientShell />)
      expect(initializePushNotifications).toHaveBeenCalled()
    })
  })

  describe('authenticated user rendering', () => {
    it('renders authenticated modals when user is present', async () => {
      mockUseAuthStore.mockReturnValue({ initialize: mockInitialize, user: mockUser })

      render(<ClientShell />)

      expect(await screen.findByTestId('call-modal')).toBeInTheDocument()
      expect(await screen.findByTestId('incoming-call-modal')).toBeInTheDocument()
      expect(await screen.findByTestId('command-palette')).toBeInTheDocument()
      expect(await screen.findByTestId('create-session-modal')).toBeInTheDocument()
    })

    it('does not render authenticated modals when user is null', () => {
      mockUseAuthStore.mockReturnValue({ initialize: mockInitialize, user: null })

      render(<ClientShell />)

      expect(screen.queryByTestId('call-modal')).not.toBeInTheDocument()
      expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument()
      expect(screen.queryByTestId('create-session-modal')).not.toBeInTheDocument()
    })
  })

  describe('PWA install prompt', () => {
    it('captures beforeinstallprompt event', async () => {
      const mod = await import('../hooks/usePWAInstall')
      const setDeferredPrompt = vi.fn()
      ;(
        mod.usePWAInstallStore as unknown as { getState: ReturnType<typeof vi.fn> }
      ).getState.mockReturnValue({ setDeferredPrompt })

      render(<ClientShell />)

      const event = new Event('beforeinstallprompt')
      window.dispatchEvent(event)

      expect(setDeferredPrompt).toHaveBeenCalled()
    })

    it('prevents default on beforeinstallprompt', () => {
      render(<ClientShell />)

      const event = new Event('beforeinstallprompt', { cancelable: true })
      const preventSpy = vi.spyOn(event, 'preventDefault')
      window.dispatchEvent(event)

      expect(preventSpy).toHaveBeenCalled()
    })
  })

  describe('hooks integration', () => {
    it('calls useDocumentTitle', async () => {
      const { useDocumentTitle } = await import('../hooks/useDocumentTitle')
      render(<ClientShell />)
      expect(useDocumentTitle).toHaveBeenCalled()
    })

    it('calls useScrollRestoration', async () => {
      const { useScrollRestoration } = await import('../hooks/useScrollRestoration')
      render(<ClientShell />)
      expect(useScrollRestoration).toHaveBeenCalled()
    })

    it('calls useSwipeBack', async () => {
      const { useSwipeBack } = await import('../hooks/useSwipeBack')
      render(<ClientShell />)
      expect(useSwipeBack).toHaveBeenCalled()
    })

    it('calls useNavigationProgress', async () => {
      const { useNavigationProgress } = await import('../hooks/useNavigationProgress')
      render(<ClientShell />)
      expect(useNavigationProgress).toHaveBeenCalled()
    })
  })

  describe('error tracker initialization', () => {
    it('initializes error tracker when user authenticates', async () => {
      mockUseAuthStore.mockReturnValue({ initialize: mockInitialize, user: mockUser })
      const { initErrorTracker } = await import('../lib/errorTracker')

      render(<ClientShell />)

      // Wait for the async effect
      await vi.waitFor(() => {
        expect(initErrorTracker).toHaveBeenCalled()
      })
    })

    it('does not initialize error tracker when no user', async () => {
      mockUseAuthStore.mockReturnValue({ initialize: mockInitialize, user: null })
      const { initErrorTracker } = await import('../lib/errorTracker')

      render(<ClientShell />)

      expect(initErrorTracker).not.toHaveBeenCalled()
    })
  })

  describe('GlobalStateBanners sub-component', () => {
    it('does not show session expired modal by default', () => {
      render(<ClientShell />)
      expect(screen.queryByTestId('session-expired-modal')).not.toBeInTheDocument()
    })

    it('does not show rate limit banner by default', () => {
      render(<ClientShell />)
      expect(screen.queryByTestId('rate-limit-banner')).not.toBeInTheDocument()
    })
  })
})
