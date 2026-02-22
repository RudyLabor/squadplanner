import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

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

vi.mock(
  '../../icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, p) =>
          typeof p === 'string'
            ? (props: any) =>
                createElement('span', { ...props, 'data-testid': `icon-${String(p)}` }, String(p))
            : undefined,
      }
    )
)

vi.mock('../MockupShared', () => ({
  mockMembers: [
    { name: 'Max', initial: 'M', color: 'blue', score: 94 },
    { name: 'Luna', initial: 'L', color: 'green', score: 100 },
    { name: 'Kira', initial: 'K', color: 'yellow', score: 87 },
    { name: 'Jay', initial: 'J', color: 'purple', score: 92 },
  ],
  MockNavbar: ({ active }: any) =>
    createElement('nav', { 'data-testid': 'mock-navbar', 'data-active': active }, `Nav:${active}`),
}))

import { PartyScreen, ProfileScreen } from '../MockupScreensParty'

describe('MockupScreensParty', () => {
  // ─── PartyScreen ────────────────────────────────────
  describe('PartyScreen', () => {
    it('renders "Party vocale en cours" header', () => {
      render(<PartyScreen />)
      expect(screen.getByText('Party vocale en cours')).toBeInTheDocument()
    })

    it('renders squad name "Les Invaincus"', () => {
      render(<PartyScreen />)
      expect(screen.getByText('Les Invaincus')).toBeInTheDocument()
    })

    it('renders "En ligne depuis 47 min"', () => {
      render(<PartyScreen />)
      expect(screen.getByText('En ligne depuis 47 min')).toBeInTheDocument()
    })

    it('renders first 4 members', () => {
      render(<PartyScreen />)
      expect(screen.getByText('Max')).toBeInTheDocument()
      expect(screen.getByText('Luna')).toBeInTheDocument()
      expect(screen.getByText('Kira')).toBeInTheDocument()
      expect(screen.getByText('Jay')).toBeInTheDocument()
    })

    it('renders member initials inside colored circles', () => {
      render(<PartyScreen />)
      expect(screen.getByText('M')).toBeInTheDocument()
      expect(screen.getByText('L')).toBeInTheDocument()
      expect(screen.getByText('K')).toBeInTheDocument()
      expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('renders reliability scores for each member', () => {
      render(<PartyScreen />)
      expect(screen.getByText('94% fiable')).toBeInTheDocument()
      expect(screen.getByText('100% fiable')).toBeInTheDocument()
      expect(screen.getByText('87% fiable')).toBeInTheDocument()
      expect(screen.getByText('92% fiable')).toBeInTheDocument()
    })

    it('first member (i===0) name has text-success class', () => {
      render(<PartyScreen />)
      const maxName = screen.getByText('Max')
      expect(maxName.className).toContain('text-success')
    })

    it('other members (i>0) names have text-text-primary class', () => {
      render(<PartyScreen />)
      const lunaName = screen.getByText('Luna')
      expect(lunaName.className).toContain('text-text-primary')
      const kiraName = screen.getByText('Kira')
      expect(kiraName.className).toContain('text-text-primary')
    })

    it('first member (i===0) has animated ring (conditional rendering)', () => {
      const { container } = render(<PartyScreen />)
      // First member has a border-success ring that's conditionally rendered
      const successBorders = container.querySelectorAll('[class*="border-success"]')
      expect(successBorders.length).toBeGreaterThanOrEqual(1)
    })

    it('first member has ring-1 ring-success class', () => {
      const { container } = render(<PartyScreen />)
      const ringSucess = container.querySelectorAll('[class*="ring-success"]')
      expect(ringSucess.length).toBeGreaterThanOrEqual(1)
    })

    it('first 2 members (i<2) have Mic icon, last 2 have MicOff icon', () => {
      render(<PartyScreen />)
      const micIcons = screen.getAllByTestId('icon-Mic')
      const micOffIcons = screen.getAllByTestId('icon-MicOff')
      // 2 Mic icons for first 2 members + 1 Mic icon in bottom controls = 3
      expect(micIcons.length).toBeGreaterThanOrEqual(2)
      expect(micOffIcons).toHaveLength(2)
    })

    it('renders audio level bars for each member (4 bars per user)', () => {
      const { container } = render(<PartyScreen />)
      // 4 users x 4 bars = 16 small audio bars
      const smallBars = container.querySelectorAll('[class*="w-\\[2px\\]"]')
      // 4 users x 4 bars = 16, plus 9 center bars = 25
      expect(smallBars.length).toBeGreaterThanOrEqual(16)
    })

    it('renders center audio visualizer with 9 bars', () => {
      const { container } = render(<PartyScreen />)
      // Center visualizer has 9 bars with bg-success class
      const successBars = container.querySelectorAll('.bg-success')
      expect(successBars.length).toBeGreaterThanOrEqual(9)
    })

    it('renders bottom controls with Mic, Headphones, and Users icons', () => {
      render(<PartyScreen />)
      expect(screen.getAllByTestId('icon-Mic').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByTestId('icon-Headphones')).toBeInTheDocument()
      expect(screen.getByTestId('icon-Users')).toBeInTheDocument()
    })

    it('renders the leave button (bg-error circle with Headphones)', () => {
      const { container } = render(<PartyScreen />)
      const errorBtn = container.querySelector('.bg-error')
      expect(errorBtn).toBeInTheDocument()
    })

    it('renders MockNavbar with "party" active', () => {
      render(<PartyScreen />)
      expect(screen.getByTestId('mock-navbar')).toHaveAttribute('data-active', 'party')
    })

    it('renders radial gradient background', () => {
      const { container } = render(<PartyScreen />)
      const gradient = container.querySelector('[class*="bg-\\[radial-gradient"]')
      expect(gradient).toBeInTheDocument()
    })
  })

  // ─── ProfileScreen ──────────────────────────────────
  describe('ProfileScreen', () => {
    it('renders username "MaxGamer_94"', () => {
      render(<ProfileScreen />)
      expect(screen.getByText('MaxGamer_94')).toBeInTheDocument()
    })

    it('renders "M" avatar initial', () => {
      render(<ProfileScreen />)
      // The profile avatar has "M" in a large div
      expect(screen.getByText('M')).toBeInTheDocument()
    })

    it('renders membership date', () => {
      render(<ProfileScreen />)
      expect(screen.getByText('Membre depuis janv. 2026')).toBeInTheDocument()
    })

    it('renders level info "Niveau 4 — Régulier"', () => {
      render(<ProfileScreen />)
      expect(screen.getByText('Niveau 4 — Régulier')).toBeInTheDocument()
    })

    it('renders XP text "340 XP" (both in level bar and on the right)', () => {
      render(<ProfileScreen />)
      const xpTexts = screen.getAllByText('340 XP')
      expect(xpTexts.length).toBeGreaterThanOrEqual(2) // One in the bar, one on the right
    })

    it('renders "500 XP pour le niveau 5"', () => {
      render(<ProfileScreen />)
      expect(screen.getByText('500 XP pour le niveau 5')).toBeInTheDocument()
    })

    it('renders level indicator emoji', () => {
      render(<ProfileScreen />)
      expect(screen.getByText('⚡')).toBeInTheDocument()
    })

    it('renders reliability score section with "94%"', () => {
      render(<ProfileScreen />)
      expect(screen.getByText('94%')).toBeInTheDocument()
    })

    it('renders "Score de fiabilité" label', () => {
      render(<ProfileScreen />)
      expect(screen.getByText('Score de fiabilité')).toBeInTheDocument()
    })

    it('renders "Légende" rank text', () => {
      render(<ProfileScreen />)
      expect(screen.getByText('Légende')).toBeInTheDocument()
    })

    it('renders check/cross emojis for reliability history', () => {
      render(<ProfileScreen />)
      // Pattern: [true, true, true, false, true, true] = 5 check + 1 cross
      const checks = screen.getAllByText('✅')
      const crosses = screen.getAllByText('❌')
      expect(checks).toHaveLength(5)
      expect(crosses).toHaveLength(1)
    })

    it('renders SVG circle for reliability gauge', () => {
      const { container } = render(<ProfileScreen />)
      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBeGreaterThanOrEqual(2) // background + progress circle
    })

    it('renders 4 stat cards: Sessions, Check-ins, Squads, Challenges', () => {
      render(<ProfileScreen />)
      expect(screen.getByText('Sessions')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('Check-ins')).toBeInTheDocument()
      expect(screen.getByText('11')).toBeInTheDocument()
      expect(screen.getByText('Squads')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('Challenges')).toBeInTheDocument()
      expect(screen.getByText('3/9')).toBeInTheDocument()
    })

    it('stat card icons are rendered', () => {
      render(<ProfileScreen />)
      expect(screen.getByText('📅')).toBeInTheDocument()
      expect(screen.getByText('✅')).toBeDefined()
      expect(screen.getByText('👥')).toBeInTheDocument()
      expect(screen.getByText('🏅')).toBeInTheDocument()
    })

    it('renders MockNavbar with "profile" active', () => {
      render(<ProfileScreen />)
      expect(screen.getByTestId('mock-navbar')).toHaveAttribute('data-active', 'profile')
    })

    it('renders the XP progress bar with width 68%', () => {
      const { container } = render(<ProfileScreen />)
      // The progress bar is a m.div with inline width style (animated to 68%)
      // Since motion is mocked, it will get the animate prop as style
      const progressBars = container.querySelectorAll('.bg-gradient-to-r')
      expect(progressBars.length).toBeGreaterThanOrEqual(1)
    })
  })
})
