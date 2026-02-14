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

  it('renders nothing when online', () => {
    const { container } = render(createElement(OfflineBanner))
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('renders offline banner when showOfflineBanner is true', () => {
    mockedUseOfflineBanner.mockReturnValue({
      showOfflineBanner: true,
      showReconnectedBanner: false,
      dismissOfflineBanner: vi.fn(),
      dismissReconnectedBanner: vi.fn(),
    })
    render(createElement(OfflineBanner))
    expect(screen.getByText('Hors ligne')).toBeDefined()
    expect(screen.getByText('Vérifie ta connexion internet')).toBeDefined()
  })

  it('renders reconnected banner when showReconnectedBanner is true', () => {
    mockedUseOfflineBanner.mockReturnValue({
      showOfflineBanner: false,
      showReconnectedBanner: true,
      dismissOfflineBanner: vi.fn(),
      dismissReconnectedBanner: vi.fn(),
    })
    render(createElement(OfflineBanner))
    expect(screen.getByText('Connexion rétablie')).toBeDefined()
  })

  it('calls dismissOfflineBanner when offline close button is clicked', () => {
    const dismissFn = vi.fn()
    mockedUseOfflineBanner.mockReturnValue({
      showOfflineBanner: true,
      showReconnectedBanner: false,
      dismissOfflineBanner: dismissFn,
      dismissReconnectedBanner: vi.fn(),
    })
    render(createElement(OfflineBanner))
    const closeButtons = screen.getAllByLabelText('Fermer')
    fireEvent.click(closeButtons[0])
    expect(dismissFn).toHaveBeenCalled()
  })
})
