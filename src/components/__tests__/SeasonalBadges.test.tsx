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
const mockFormatSeason = vi.fn().mockImplementation((s: string) => s)
vi.mock('../badges/badgeConfig', () => ({
  BADGE_CONFIGS: {
    mvp: { label: 'MVP', icon: (props: any) => createElement('svg', { ...props, 'data-testid': 'badge-icon-mvp' }), color: '#FFD700', bgColor: '#FFF8E1', glowColor: 'rgba(255,215,0,0.3)' },
    top_scorer: { label: 'Top Scorer', icon: (props: any) => createElement('svg', { ...props, 'data-testid': 'badge-icon-scorer' }), color: '#FF6B6B', bgColor: '#FFE8E8', glowColor: 'rgba(255,107,107,0.3)' },
  },
  formatSeason: (...args: any[]) => mockFormatSeason(...args),
}))

// Mock BadgeDetailModal
vi.mock('../badges/BadgeDetailModal', () => ({
  BadgeDetailModal: ({ badge, onClose }: any) =>
    badge ? createElement('div', { 'data-testid': 'badge-modal' }, badge.badge_type) : null,
}))

import { SeasonalBadges } from '../SeasonalBadges'

const makeBadge = (overrides: any = {}) => ({
  id: 'b1',
  user_id: 'user-1',
  badge_type: 'mvp',
  season: '2026-S1',
  squad_id: null,
  awarded_at: '2026-01-15T00:00:00Z',
  squads: null,
  ...overrides,
})

describe('SeasonalBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // STRICT: Verifies empty state rendering — trophy icon, text messages, no badges, correct structure
  it('renders empty state with trophy icon and messages when no badges exist', () => {
    const { container } = render(createElement(SeasonalBadges, { initialBadges: [] }))

    // 1. Empty state message
    expect(screen.getByText('Pas encore de badges saisonniers')).toBeInTheDocument()
    // 2. Encouragement text
    expect(screen.getByText('Continue à jouer pour en débloquer !')).toBeInTheDocument()
    // 3. Trophy icon is visible
    expect(screen.getByTestId('icon-trophy')).toBeInTheDocument()
    // 4. No badge modal visible
    expect(screen.queryByTestId('badge-modal')).not.toBeInTheDocument()
    // 5. Container has content (not loading)
    expect(container.innerHTML).not.toBe('')
    // 6. No badge icons rendered
    expect(screen.queryByTestId('badge-icon-mvp')).not.toBeInTheDocument()
  })

  // STRICT: Verifies badge rendering in full mode — season header, badge icons, formatSeason called, correct structure
  it('renders badges grouped by season in full mode with correct labels', () => {
    const badges = [
      makeBadge({ id: 'b1', badge_type: 'mvp', season: '2026-S1' }),
      makeBadge({ id: 'b2', badge_type: 'top_scorer', season: '2026-S1' }),
    ]

    render(createElement(SeasonalBadges, { initialBadges: badges }))

    // 1. Season header displayed via formatSeason
    expect(screen.getByText('2026-S1')).toBeInTheDocument()
    // 2. formatSeason was called with the season string
    expect(mockFormatSeason).toHaveBeenCalledWith('2026-S1')
    // 3. MVP badge icon rendered
    expect(screen.getByTestId('badge-icon-mvp')).toBeInTheDocument()
    // 4. Top Scorer badge icon rendered
    expect(screen.getByTestId('badge-icon-scorer')).toBeInTheDocument()
    // 5. No empty state message
    expect(screen.queryByText('Pas encore de badges saisonniers')).not.toBeInTheDocument()
    // 6. Badge labels appear in hover tooltip area
    expect(screen.getByText('MVP')).toBeInTheDocument()
    expect(screen.getByText('Top Scorer')).toBeInTheDocument()
  })

  // STRICT: Verifies compact mode — aria-label on buttons, limited display, overflow indicator for >6 badges
  it('renders compact mode with aria-labels and overflow indicator for many badges', () => {
    const badges = [
      makeBadge({ id: 'b1', badge_type: 'mvp', season: '2026-S1' }),
      makeBadge({ id: 'b2', badge_type: 'mvp', season: '2026-S1' }),
      makeBadge({ id: 'b3', badge_type: 'mvp', season: '2026-S1' }),
      makeBadge({ id: 'b4', badge_type: 'mvp', season: '2026-S1' }),
      makeBadge({ id: 'b5', badge_type: 'mvp', season: '2026-S1' }),
      makeBadge({ id: 'b6', badge_type: 'mvp', season: '2026-S1' }),
      makeBadge({ id: 'b7', badge_type: 'mvp', season: '2026-S1' }),
    ]

    render(createElement(SeasonalBadges, { initialBadges: badges, compact: true }))

    // 1. Compact mode: badges have aria-labels
    const badgeButtons = screen.getAllByLabelText(/MVP/)
    expect(badgeButtons.length).toBe(6) // Only first 6 shown in compact
    // 2. Overflow indicator "+1" for the 7th badge
    expect(screen.getByText('+1')).toBeInTheDocument()
    // 3. No season header in compact mode
    expect(screen.queryByText('2026-S1')).not.toBeInTheDocument()
    // 4. No empty state
    expect(screen.queryByText('Pas encore de badges saisonniers')).not.toBeInTheDocument()
    // 5. Each badge button is a button element
    expect(badgeButtons[0].tagName).toBe('BUTTON')
    // 6. formatSeason was called (for aria-label construction)
    expect(mockFormatSeason).toHaveBeenCalled()
  })

  // STRICT: Verifies loading state — skeleton elements, no badges, no empty state
  it('renders loading skeletons when no initialBadges provided (loading state)', () => {
    const { container } = render(createElement(SeasonalBadges, {}))

    // 1. Loading skeletons are present
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(3) // 3 skeleton items
    // 2. No badge text visible
    expect(screen.queryByText('Pas encore de badges saisonniers')).not.toBeInTheDocument()
    // 3. No season headers
    expect(screen.queryByText('2026-S1')).not.toBeInTheDocument()
    // 4. No badge icons
    expect(screen.queryByTestId('badge-icon-mvp')).not.toBeInTheDocument()
    // 5. No trophy icon (that's empty state, not loading)
    expect(screen.queryByTestId('icon-trophy')).not.toBeInTheDocument()
    // 6. Container has content (skeletons)
    expect(container.innerHTML).not.toBe('')
  })
})
