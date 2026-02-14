import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  Bell: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-bell' }),
  CheckCheck: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-checkcheck' }),
  X: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-x' }),
}))

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        neq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        eq: vi.fn().mockReturnValue({ data: [], error: null }),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
}))

// Mock auth store
vi.mock('../../hooks', () => ({
  useAuthStore: vi.fn().mockReturnValue({ user: { id: 'user-1' } }),
}))

// Mock overlay store
vi.mock('../../hooks/useOverlayStore', () => ({
  useOverlayStore: vi.fn().mockReturnValue({
    activeOverlay: null,
    toggle: vi.fn(),
    close: vi.fn(),
  }),
}))

import { NotificationBell } from '../NotificationCenter'

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the bell button', () => {
    render(createElement(NotificationBell))
    const button = screen.getByLabelText('Notifications')
    expect(button).toBeDefined()
  })

  it('renders with correct aria-label', () => {
    render(createElement(NotificationBell))
    expect(screen.getByLabelText('Notifications')).toBeDefined()
  })
})
