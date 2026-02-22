import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

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

// Mock icons
vi.mock('../icons', () => ({
  X: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-x' }),
  CheckCircle2: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-check' }),
  AlertTriangle: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-alert' }),
  Info: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-info' }),
  Trophy: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-trophy' }),
  RefreshCw: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-refresh' }),
}))

const mockDismissBanner = vi.fn()
const mockBanners = vi.fn().mockReturnValue([])

vi.mock('../../hooks/useNotificationBanner', () => ({
  useNotificationBannerStore: () => ({
    banners: mockBanners(),
    dismissBanner: mockDismissBanner,
  }),
}))

import NotificationBanner from '../NotificationBanner'

describe('NotificationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBanners.mockReturnValue([])
  })

  it('renders nothing when no banners', () => {
    const { container } = render(createElement(NotificationBanner))
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('renders active banner with title', () => {
    mockBanners.mockReturnValue([
      { id: '1', type: 'info', title: 'Test Banner', dismissible: true },
    ])
    render(createElement(NotificationBanner))
    expect(screen.getByText('Test Banner')).toBeDefined()
  })

  it('renders banner message when provided', () => {
    mockBanners.mockReturnValue([
      { id: '1', type: 'success', title: 'Title', message: 'Detail message', dismissible: true },
    ])
    render(createElement(NotificationBanner))
    expect(screen.getByText('Detail message')).toBeDefined()
  })

  it('calls dismissBanner when close button is clicked', () => {
    mockBanners.mockReturnValue([
      { id: 'b1', type: 'warning', title: 'Warning', dismissible: true },
    ])
    render(createElement(NotificationBanner))
    const closeButton = screen.getByLabelText('Fermer')
    fireEvent.click(closeButton)
    expect(mockDismissBanner).toHaveBeenCalledWith('b1')
  })

  it('renders action buttons and calls onClick', () => {
    const actionClick = vi.fn()
    mockBanners.mockReturnValue([
      {
        id: 'b2',
        type: 'update',
        title: 'Update',
        dismissible: true,
        actions: [{ label: 'Retry', onClick: actionClick, variant: 'primary' }],
      },
    ])
    render(createElement(NotificationBanner))
    const actionBtn = screen.getByText('Retry')
    fireEvent.click(actionBtn)
    expect(actionClick).toHaveBeenCalled()
    expect(mockDismissBanner).toHaveBeenCalledWith('b2')
  })

  it('does not show close button when dismissible is false', () => {
    mockBanners.mockReturnValue([
      { id: 'b3', type: 'achievement', title: 'Achievement', dismissible: false },
    ])
    render(createElement(NotificationBanner))
    expect(screen.queryByLabelText('Fermer')).toBeNull()
  })
})
