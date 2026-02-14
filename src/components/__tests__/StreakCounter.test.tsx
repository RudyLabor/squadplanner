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
  Flame: (props: any) => createElement('svg', props),
  Gift: (props: any) => createElement('svg', props),
  Sparkles: (props: any) => createElement('svg', props),
  Check: (props: any) => createElement('svg', props),
  Zap: (props: any) => createElement('svg', props),
}))

// Mock ui
vi.mock('../ui', () => ({
  Card: ({ children, className, ...props }: any) => createElement('div', { className, ...props }, children),
}))

// Mock streak utilities
vi.mock('../streak/streakUtils', () => ({
  MILESTONES: [{ days: 7, label: '1 semaine', emoji: '🔥', xp: 50 }],
  calculateXPReward: vi.fn().mockReturnValue(10),
  getNextMilestone: vi.fn().mockReturnValue({ label: '1 semaine', emoji: '🔥', xp: 50, progress: 43, daysRemaining: 4 }),
  getFlameIntensity: vi.fn().mockReturnValue(1),
  getFlameColors: vi.fn().mockReturnValue({ primary: '#FF6B35', secondary: '#FFC107', glow: 'rgba(255,107,53,0.3)' }),
}))

// Mock sub-components
vi.mock('../streak/StreakMilestoneToast', () => ({
  StreakMilestoneToast: () => null,
}))
vi.mock('../streak/StreakHeatmap', () => ({
  StreakHeatmap: () => createElement('div', { 'data-testid': 'heatmap' }),
}))

import { StreakCounter } from '../StreakCounter'

describe('StreakCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders streak days', () => {
    render(createElement(StreakCounter, {
      streakDays: 3,
      lastActiveDate: null,
    }))
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('jours')).toBeDefined()
  })

  it('uses singular "jour" for 1 day', () => {
    render(createElement(StreakCounter, {
      streakDays: 1,
      lastActiveDate: null,
    }))
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.getByText('jour')).toBeDefined()
  })

  it('renders next milestone info', () => {
    render(createElement(StreakCounter, {
      streakDays: 3,
      lastActiveDate: null,
    }))
    expect(screen.getByText('Prochain objectif')).toBeDefined()
  })

  it('renders check-in button when onCheckIn is provided', () => {
    render(createElement(StreakCounter, {
      streakDays: 3,
      lastActiveDate: null,
      onCheckIn: vi.fn(),
    }))
    expect(screen.getByText('Pointer')).toBeDefined()
  })

  it('calls onCheckIn when button clicked', () => {
    const onCheckIn = vi.fn()
    render(createElement(StreakCounter, {
      streakDays: 3,
      lastActiveDate: null,
      onCheckIn,
    }))
    fireEvent.click(screen.getByText('Pointer'))
    expect(onCheckIn).toHaveBeenCalled()
  })

  it('shows "Fait" when already checked in today', () => {
    const today = new Date().toISOString().split('T')[0]
    render(createElement(StreakCounter, {
      streakDays: 3,
      lastActiveDate: today,
      onCheckIn: vi.fn(),
    }))
    expect(screen.getByText('Fait')).toBeDefined()
  })

  it('shows tip for low streaks', () => {
    render(createElement(StreakCounter, {
      streakDays: 3,
      lastActiveDate: null,
    }))
    expect(screen.getByText(/Continue comme ça/)).toBeDefined()
  })

  it('renders aria-label with streak info', () => {
    const { container } = render(createElement(StreakCounter, {
      streakDays: 5,
      lastActiveDate: null,
    }))
    const card = container.querySelector('[aria-label]')
    expect(card?.getAttribute('aria-label')).toContain('5')
  })
})
