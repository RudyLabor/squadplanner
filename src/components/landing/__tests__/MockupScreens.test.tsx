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
    { name: 'Zoe', initial: 'Z', color: 'red', score: 78 },
  ],
  MockNavbar: ({ active }: any) =>
    createElement('nav', { 'data-testid': 'mock-navbar', 'data-active': active }, `Nav:${active}`),
}))

vi.mock('../MockupScreensParty', () => ({
  PartyScreen: () => createElement('div', { 'data-testid': 'party-screen' }, 'PartyScreen'),
  ProfileScreen: () => createElement('div', { 'data-testid': 'profile-screen' }, 'ProfileScreen'),
}))

import { HomeScreen, SquadScreen, screens, mockMembers, MockNavbar } from '../MockupScreens'

describe('MockupScreens', () => {
  // ─── Re-exports ─────────────────────────────────────
  describe('re-exports', () => {
    it('re-exports mockMembers from MockupShared', () => {
      expect(mockMembers).toBeDefined()
      expect(Array.isArray(mockMembers)).toBe(true)
      expect(mockMembers).toHaveLength(5)
    })

    it('re-exports MockNavbar from MockupShared', () => {
      expect(MockNavbar).toBeDefined()
      expect(typeof MockNavbar).toBe('function')
    })
  })

  // ─── screens config ─────────────────────────────────
  describe('screens config', () => {
    it('exports exactly 4 screens', () => {
      expect(screens).toHaveLength(4)
    })

    it('screens are in correct order: home, squad, party, profile', () => {
      expect(screens[0].id).toBe('home')
      expect(screens[1].id).toBe('squad')
      expect(screens[2].id).toBe('party')
      expect(screens[3].id).toBe('profile')
    })

    it('each screen has component, label, and duration fields', () => {
      for (const s of screens) {
        expect(s).toHaveProperty('id')
        expect(s).toHaveProperty('component')
        expect(s).toHaveProperty('label')
        expect(s).toHaveProperty('duration')
        expect(typeof s.component).toBe('function')
        expect(typeof s.label).toBe('string')
        expect(typeof s.duration).toBe('number')
      }
    })

    it('home screen has correct label and duration', () => {
      expect(screens[0].label).toBe('Accueil')
      expect(screens[0].duration).toBe(4000)
    })

    it('squad screen has correct label and duration', () => {
      expect(screens[1].label).toBe('Squad')
      expect(screens[1].duration).toBe(4000)
    })

    it('party screen has correct label and duration', () => {
      expect(screens[2].label).toBe('Party')
      expect(screens[2].duration).toBe(3500)
    })

    it('profile screen has correct label and duration', () => {
      expect(screens[3].label).toBe('Profil')
      expect(screens[3].duration).toBe(3500)
    })

    it('home screen component is HomeScreen', () => {
      expect(screens[0].component).toBe(HomeScreen)
    })

    it('squad screen component is SquadScreen', () => {
      expect(screens[1].component).toBe(SquadScreen)
    })
  })

  // ─── HomeScreen ─────────────────────────────────────
  describe('HomeScreen', () => {
    it('renders greeting text', () => {
      render(<HomeScreen />)
      expect(screen.getByText('Salut MaxGamer_94 !')).toBeInTheDocument()
    })

    it('renders subtitle text', () => {
      render(<HomeScreen />)
      expect(
        screen.getByText("T'es carré, toutes tes sessions sont confirmées")
      ).toBeInTheDocument()
    })

    it('renders 100% fiable badge', () => {
      render(<HomeScreen />)
      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('fiable')).toBeInTheDocument()
    })

    it('renders the session card with "Ranked du Mardi"', () => {
      render(<HomeScreen />)
      expect(screen.getByText('Ranked du Mardi')).toBeInTheDocument()
    })

    it('renders session details: squad, time, and confirmed status', () => {
      render(<HomeScreen />)
      expect(screen.getByText('Les Invaincus · Demain 21h')).toBeInTheDocument()
      expect(screen.getByText('Confirmée')).toBeInTheDocument()
    })

    it('renders first 4 member initials from mockMembers', () => {
      render(<HomeScreen />)
      expect(screen.getByText('M')).toBeInTheDocument()
      expect(screen.getByText('L')).toBeInTheDocument()
      expect(screen.getByText('K')).toBeInTheDocument()
      expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('renders "4/5 présents" text', () => {
      render(<HomeScreen />)
      expect(screen.getByText('4/5 présents')).toBeInTheDocument()
    })

    it('renders attendance confirmation with Check icon', () => {
      render(<HomeScreen />)
      expect(screen.getByText('Présent')).toBeInTheDocument()
    })

    it('renders the Calendar icon', () => {
      render(<HomeScreen />)
      expect(screen.getByTestId('icon-Calendar')).toBeInTheDocument()
    })

    it('renders 3 stat cards: Fiabilité, Sessions, Streak', () => {
      render(<HomeScreen />)
      expect(screen.getByText('Fiabilité')).toBeInTheDocument()
      expect(screen.getByText('94%')).toBeInTheDocument()
      expect(screen.getByText('Sessions')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('Streak')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('stat cards have correct colors via inline styles', () => {
      const { container } = render(<HomeScreen />)
      // 94% should have success color
      const value94 = screen.getByText('94%')
      expect(value94).toHaveStyle({ color: 'var(--color-success)' })
      // 12 should have primary color
      const value12 = screen.getByText('12')
      expect(value12).toHaveStyle({ color: 'var(--color-primary)' })
      // 5 should have gold color
      const value5 = screen.getByText('5')
      expect(value5).toHaveStyle({ color: 'var(--color-gold)' })
    })

    it('renders "Ta semaine" weekly summary section', () => {
      render(<HomeScreen />)
      expect(screen.getByText('Ta semaine')).toBeInTheDocument()
    })

    it('renders "3 sessions jouées" and "100% présent"', () => {
      render(<HomeScreen />)
      expect(screen.getByText('3 sessions jouées')).toBeInTheDocument()
      expect(screen.getByText('100% présent')).toBeInTheDocument()
    })

    it('renders "Party vocale active" with Headphones icon', () => {
      render(<HomeScreen />)
      expect(screen.getByText('Party vocale active')).toBeInTheDocument()
      expect(screen.getByTestId('icon-Headphones')).toBeInTheDocument()
    })

    it('renders "2 en ligne" live indicator', () => {
      render(<HomeScreen />)
      expect(screen.getByText('2 en ligne')).toBeInTheDocument()
    })

    it('renders MockNavbar with "home" active', () => {
      render(<HomeScreen />)
      expect(screen.getByTestId('mock-navbar')).toHaveAttribute('data-active', 'home')
    })
  })

  // ─── SquadScreen ────────────────────────────────────
  describe('SquadScreen', () => {
    it('renders squad name "Les Invaincus"', () => {
      render(<SquadScreen />)
      expect(screen.getByText('Les Invaincus')).toBeInTheDocument()
    })

    it('renders squad info: game and member count', () => {
      render(<SquadScreen />)
      expect(screen.getByText('Valorant · 5 membres')).toBeInTheDocument()
    })

    it('renders invitation code section', () => {
      render(<SquadScreen />)
      expect(screen.getByText("Code d'invitation")).toBeInTheDocument()
      expect(screen.getByText('8J9DQR')).toBeInTheDocument()
      expect(screen.getByText('Copier')).toBeInTheDocument()
    })

    it('renders voice party section with Headphones icon', () => {
      render(<SquadScreen />)
      expect(screen.getByText('Party vocale')).toBeInTheDocument()
    })

    it('renders "2 en ligne" in voice section', () => {
      render(<SquadScreen />)
      expect(screen.getByText('2 en ligne')).toBeInTheDocument()
    })

    it('renders first 2 members in the voice party section', () => {
      render(<SquadScreen />)
      // First 2 members: Max and Luna
      expect(screen.getByText('Max')).toBeInTheDocument()
      expect(screen.getByText('Luna')).toBeInTheDocument()
    })

    it('renders session "Ranked du Mardi" with details', () => {
      render(<SquadScreen />)
      expect(screen.getByText('Ranked du Mardi')).toBeInTheDocument()
      expect(screen.getByText('Demain 21:00 · 4/5 présents')).toBeInTheDocument()
    })

    it('renders 3 RSVP options: Présent, Peut-être, Absent', () => {
      render(<SquadScreen />)
      expect(screen.getByText('Présent')).toBeInTheDocument()
      expect(screen.getByText('Peut-être')).toBeInTheDocument()
      expect(screen.getByText('Absent')).toBeInTheDocument()
    })

    it('"Présent" option is active with success color styling', () => {
      render(<SquadScreen />)
      const presentBtn = screen.getByText('Présent')
      // Active option has inline backgroundColor style
      expect(presentBtn).toHaveStyle({ backgroundColor: 'var(--color-success)15' })
    })

    it('"Peut-être" and "Absent" are inactive with no inline style', () => {
      render(<SquadScreen />)
      const maybeBtn = screen.getByText('Peut-être')
      const absentBtn = screen.getByText('Absent')
      // Inactive options have text-text-tertiary class
      expect(maybeBtn.className).toContain('text-text-tertiary')
      expect(absentBtn.className).toContain('text-text-tertiary')
    })

    it('renders "Membres (5)" section heading', () => {
      render(<SquadScreen />)
      expect(screen.getByText('Membres (5)')).toBeInTheDocument()
    })

    it('renders first 3 members with scores in members section', () => {
      render(<SquadScreen />)
      // Scores of first 3 members
      expect(screen.getByText('94%')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('87%')).toBeInTheDocument()
    })

    it('renders member initials in members section', () => {
      render(<SquadScreen />)
      expect(screen.getByText('K')).toBeInTheDocument()
    })

    it('renders Calendar icon in session card', () => {
      render(<SquadScreen />)
      const calendarIcons = screen.getAllByTestId('icon-Calendar')
      expect(calendarIcons.length).toBeGreaterThanOrEqual(1)
    })

    it('renders MockNavbar with "squads" active', () => {
      render(<SquadScreen />)
      expect(screen.getByTestId('mock-navbar')).toHaveAttribute('data-active', 'squads')
    })

    it('first member in voice party has animated ring (conditional i===0)', () => {
      const { container } = render(<SquadScreen />)
      // The first voice member (i===0) has an animated ring div
      // The ring is a m.div with bg-success class that only renders for i===0
      const successRings = container.querySelectorAll('.bg-success')
      // At least one ring for first member
      expect(successRings.length).toBeGreaterThanOrEqual(1)
    })
  })
})
