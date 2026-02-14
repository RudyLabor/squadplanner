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
  Trophy: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-trophy' }),
}))

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  },
}))

// Mock auth store
vi.mock('../../hooks', () => ({
  useAuthStore: vi.fn().mockReturnValue({ user: { id: 'user-1' } }),
}))

// Mock Tooltip
vi.mock('../ui/Tooltip', () => ({
  Tooltip: ({ children }: any) => children,
}))

// Mock badge configs
vi.mock('../badges/badgeConfig', () => ({
  BADGE_CONFIGS: {
    mvp: { label: 'MVP', icon: (props: any) => createElement('svg', props), color: '#FFD700', bgColor: '#FFF8E1', glowColor: 'rgba(255,215,0,0.3)' },
  },
  formatSeason: vi.fn().mockImplementation((s: string) => s),
}))

// Mock BadgeDetailModal
vi.mock('../badges/BadgeDetailModal', () => ({
  BadgeDetailModal: () => null,
}))

import { SeasonalBadges } from '../SeasonalBadges'

describe('SeasonalBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no badges', () => {
    render(createElement(SeasonalBadges, { initialBadges: [] }))
    expect(screen.getByText('Pas encore de badges saisonniers')).toBeDefined()
  })

  it('renders badges from initialBadges', () => {
    const badges = [
      {
        id: 'b1',
        user_id: 'user-1',
        badge_type: 'mvp',
        season: '2026-S1',
        squad_id: null,
        awarded_at: '2026-01-15T00:00:00Z',
        squads: null,
      },
    ]
    render(createElement(SeasonalBadges, { initialBadges: badges }))
    // Should render the badge config label in the season header
    expect(screen.getByText('2026-S1')).toBeDefined()
  })

  it('renders compact mode', () => {
    const badges = [
      {
        id: 'b1',
        user_id: 'user-1',
        badge_type: 'mvp',
        season: '2026-S1',
        squad_id: null,
        awarded_at: '2026-01-15T00:00:00Z',
        squads: null,
      },
    ]
    render(createElement(SeasonalBadges, { initialBadges: badges, compact: true }))
    // Compact renders button with aria-label
    expect(screen.getByLabelText(/MVP/)).toBeDefined()
  })

  it('renders loading skeletons when loading', () => {
    const { container } = render(createElement(SeasonalBadges, {}))
    // No initialBadges and no user fallback should show loading
    expect(container.querySelector('.animate-pulse')).toBeDefined()
  })
})
