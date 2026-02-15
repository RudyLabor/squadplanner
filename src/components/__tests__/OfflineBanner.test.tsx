import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { useOfflineBanner } from '../../hooks/useOffline'

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

// Mock icons
vi.mock('../icons', () => ({
  WifiOff: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-wifioff' }),
  Wifi: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-wifi' }),
  X: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-x' }),
}))

vi.mock('../../hooks/useOffline', () => ({
  useOfflineBanner: vi.fn().mockReturnValue({
    showOfflineBanner: false,
    showReconnectedBanner: false,
    dismissOfflineBanner: vi.fn(),
    dismissReconnectedBanner: vi.fn(),
  }),
}))

const mockedUseOfflineBanner = vi.mocked(useOfflineBanner)

import { OfflineBanner } from '../OfflineBanner'

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseOfflineBanner.mockReturnValue({
      showOfflineBanner: false,
      showReconnectedBanner: false,
      dismissOfflineBanner: vi.fn(),
      dismissReconnectedBanner: vi.fn(),
    })
  })

  // STRICT: Verifies that nothing renders when online — no alert role, no status role, no text, no icons
  it('renders nothing when both banners are hidden (online state)', () => {
    const { container } = render(createElement(OfflineBanner))

    // 1. No alert role element
    expect(container.querySelector('[role="alert"]')).toBeNull()
    // 2. No status role element
    expect(container.querySelector('[role="status"]')).toBeNull()
    // 3. No "Hors ligne" text
    expect(screen.queryByText('Hors ligne')).not.toBeInTheDocument()
    // 4. No "Connexion rétablie" text
    expect(screen.queryByText('Connexion rétablie')).not.toBeInTheDocument()
    // 5. No close buttons
    expect(screen.queryByLabelText('Fermer')).not.toBeInTheDocument()
    // 6. No wifi icons visible
    expect(screen.queryByTestId('icon-wifioff')).not.toBeInTheDocument()
    expect(screen.queryByTestId('icon-wifi')).not.toBeInTheDocument()
  })

  // STRICT: Verifies offline banner — text, role, aria-live, icon, close button, dismiss callback
  it('renders offline banner with correct text, accessibility, icon, and dismiss action', () => {
    const dismissFn = vi.fn()
    mockedUseOfflineBanner.mockReturnValue({
      showOfflineBanner: true,
      showReconnectedBanner: false,
      dismissOfflineBanner: dismissFn,
      dismissReconnectedBanner: vi.fn(),
    })

    const { container } = render(createElement(OfflineBanner))

    // 1. "Hors ligne" text visible
    expect(screen.getByText('Hors ligne')).toBeInTheDocument()
    // 2. Subtitle text visible
    expect(screen.getByText('Vérifie ta connexion internet')).toBeInTheDocument()
    // 3. Alert role present
    const alertEl = container.querySelector('[role="alert"]')
    expect(alertEl).not.toBeNull()
    // 4. aria-live is assertive for offline (urgent)
    expect(alertEl!.getAttribute('aria-live')).toBe('assertive')
    // 5. WifiOff icon visible
    expect(screen.getByTestId('icon-wifioff')).toBeInTheDocument()
    // 6. Close button present
    const closeBtn = screen.getAllByLabelText('Fermer')[0]
    expect(closeBtn).toBeInTheDocument()
    // 7. Clicking close calls dismissOfflineBanner
    fireEvent.click(closeBtn)
    expect(dismissFn).toHaveBeenCalledTimes(1)
    // 8. No reconnected text visible
    expect(screen.queryByText('Connexion rétablie')).not.toBeInTheDocument()
  })

  // STRICT: Verifies reconnected banner — text, role, aria-live, icon, close button, dismiss callback
  it('renders reconnected banner with correct text, accessibility, icon, and dismiss action', () => {
    const dismissReconnectedFn = vi.fn()
    mockedUseOfflineBanner.mockReturnValue({
      showOfflineBanner: false,
      showReconnectedBanner: true,
      dismissOfflineBanner: vi.fn(),
      dismissReconnectedBanner: dismissReconnectedFn,
    })

    const { container } = render(createElement(OfflineBanner))

    // 1. "Connexion rétablie" text visible
    expect(screen.getByText('Connexion rétablie')).toBeInTheDocument()
    // 2. Status role present
    const statusEl = container.querySelector('[role="status"]')
    expect(statusEl).not.toBeNull()
    // 3. aria-live is polite for reconnected (non-urgent)
    expect(statusEl!.getAttribute('aria-live')).toBe('polite')
    // 4. Wifi icon visible
    expect(screen.getByTestId('icon-wifi')).toBeInTheDocument()
    // 5. Close button present
    const closeBtn = screen.getAllByLabelText('Fermer')[0]
    expect(closeBtn).toBeInTheDocument()
    // 6. Clicking close calls dismissReconnectedBanner
    fireEvent.click(closeBtn)
    expect(dismissReconnectedFn).toHaveBeenCalledTimes(1)
    // 7. No offline text visible
    expect(screen.queryByText('Hors ligne')).not.toBeInTheDocument()
    // 8. No alert role (only status role)
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  // STRICT: Verifies both banners can be shown simultaneously, each has its own dismiss, correct icon per banner
  it('shows both banners simultaneously with independent dismiss callbacks', () => {
    const dismissOffline = vi.fn()
    const dismissReconnected = vi.fn()
    mockedUseOfflineBanner.mockReturnValue({
      showOfflineBanner: true,
      showReconnectedBanner: true,
      dismissOfflineBanner: dismissOffline,
      dismissReconnectedBanner: dismissReconnected,
    })

    const { container } = render(createElement(OfflineBanner))

    // 1. Both texts visible
    expect(screen.getByText('Hors ligne')).toBeInTheDocument()
    expect(screen.getByText('Connexion rétablie')).toBeInTheDocument()
    // 2. Both roles present
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(container.querySelector('[role="status"]')).not.toBeNull()
    // 3. Both icons visible
    expect(screen.getByTestId('icon-wifioff')).toBeInTheDocument()
    expect(screen.getByTestId('icon-wifi')).toBeInTheDocument()
    // 4. Two close buttons
    const closeBtns = screen.getAllByLabelText('Fermer')
    expect(closeBtns).toHaveLength(2)
    // 5. First close dismisses offline
    fireEvent.click(closeBtns[0])
    expect(dismissOffline).toHaveBeenCalledTimes(1)
    // 6. Second close dismisses reconnected
    fireEvent.click(closeBtns[1])
    expect(dismissReconnected).toHaveBeenCalledTimes(1)
  })
})
