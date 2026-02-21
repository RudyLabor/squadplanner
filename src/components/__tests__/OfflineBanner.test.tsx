import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('renders nothing when both banners are hidden (online state)', () => {
    const { container } = render(createElement(OfflineBanner))

    // No offline text
    expect(screen.queryByText(/Connexion perdue/)).not.toBeInTheDocument()
    // No reconnected text
    expect(screen.queryByText('Connexion rétablie')).not.toBeInTheDocument()
    // No wifi icons visible
    expect(screen.queryByTestId('icon-wifioff')).not.toBeInTheDocument()
    expect(screen.queryByTestId('icon-wifi')).not.toBeInTheDocument()
  })

  it('renders offline banner with correct text and icon', () => {
    mockedUseOfflineBanner.mockReturnValue({
      showOfflineBanner: true,
      showReconnectedBanner: false,
      dismissOfflineBanner: vi.fn(),
      dismissReconnectedBanner: vi.fn(),
    })

    render(createElement(OfflineBanner))

    // Offline text visible
    expect(screen.getByText(/Connexion perdue/)).toBeInTheDocument()
    // WifiOff icon visible
    expect(screen.getByTestId('icon-wifioff')).toBeInTheDocument()
    // No reconnected text
    expect(screen.queryByText('Connexion rétablie')).not.toBeInTheDocument()
  })

  it('renders reconnected banner with correct text and icon', () => {
    mockedUseOfflineBanner.mockReturnValue({
      showOfflineBanner: false,
      showReconnectedBanner: true,
      dismissOfflineBanner: vi.fn(),
      dismissReconnectedBanner: vi.fn(),
    })

    render(createElement(OfflineBanner))

    // Reconnected text visible
    expect(screen.getByText('Connexion rétablie')).toBeInTheDocument()
    // Wifi icon visible
    expect(screen.getByTestId('icon-wifi')).toBeInTheDocument()
    // No offline text
    expect(screen.queryByText(/Connexion perdue/)).not.toBeInTheDocument()
  })

  it('shows both banners simultaneously', () => {
    mockedUseOfflineBanner.mockReturnValue({
      showOfflineBanner: true,
      showReconnectedBanner: true,
      dismissOfflineBanner: vi.fn(),
      dismissReconnectedBanner: vi.fn(),
    })

    render(createElement(OfflineBanner))

    // Both texts visible
    expect(screen.getByText(/Connexion perdue/)).toBeInTheDocument()
    expect(screen.getByText('Connexion rétablie')).toBeInTheDocument()
    // Both icons visible
    expect(screen.getByTestId('icon-wifioff')).toBeInTheDocument()
    expect(screen.getByTestId('icon-wifi')).toBeInTheDocument()
  })
})
