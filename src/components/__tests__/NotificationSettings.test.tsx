import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'

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
  Moon: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-moon' }),
  Volume2: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-volume' }),
  Vibrate: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-vibrate' }),
  Loader2: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-loader' }),
}))

vi.mock('../../hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: vi.fn().mockReturnValue({
    preferences: {
      sound_enabled: true,
      vibration_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
    },
    isLoading: false,
    updatePreference: vi.fn(),
    updateQuietHours: vi.fn(),
    toggleSound: vi.fn(),
    toggleVibration: vi.fn(),
    toggleCategory: vi.fn(),
  }),
  NOTIFICATION_CATEGORIES: [
    {
      key: 'sessions',
      label: 'Sessions',
      icon: '📅',
      settings: [
        { key: 'notify_new_session', label: 'Nouvelles sessions' },
      ],
    },
  ],
}))

const mockedUseNotificationPreferences = vi.mocked(useNotificationPreferences)

import { NotificationSettings } from '../NotificationSettings'

describe('NotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseNotificationPreferences.mockReturnValue({
      preferences: {
        sound_enabled: true,
        vibration_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
      },
      isLoading: false,
      updatePreference: vi.fn(),
      updateQuietHours: vi.fn(),
      toggleSound: vi.fn(),
      toggleVibration: vi.fn(),
      toggleCategory: vi.fn(),
    } as any)
  })

  it('renders general settings section', () => {
    render(createElement(NotificationSettings))
    expect(screen.getByText('Général')).toBeDefined()
  })

  it('renders sound toggle', () => {
    render(createElement(NotificationSettings))
    expect(screen.getByText('Sons de notification')).toBeDefined()
  })

  it('renders vibration toggle', () => {
    render(createElement(NotificationSettings))
    expect(screen.getByText('Vibration')).toBeDefined()
  })

  it('renders quiet hours section', () => {
    render(createElement(NotificationSettings))
    expect(screen.getByText('Heures silencieuses')).toBeDefined()
  })

  it('renders notification categories', () => {
    render(createElement(NotificationSettings))
    expect(screen.getByText('Sessions')).toBeDefined()
  })

  it('shows loader when loading', () => {
    mockedUseNotificationPreferences.mockReturnValue({
      preferences: null,
      isLoading: true,
      updatePreference: vi.fn(),
      updateQuietHours: vi.fn(),
      toggleSound: vi.fn(),
      toggleVibration: vi.fn(),
      toggleCategory: vi.fn(),
    } as any)
    const { container } = render(createElement(NotificationSettings))
    expect(container.querySelector('[data-testid="icon-loader"]')).toBeDefined()
  })
})
