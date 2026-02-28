import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

vi.mock('../../icons', () => ({
  Check: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-check' }, 'check'),
  X: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-x' }, 'x'),
}))

vi.mock('../../SquadPlannerLogo', () => ({
  SquadPlannerLogo: ({ size }: any) =>
    createElement('span', { 'data-testid': 'sp-logo', 'data-size': size }, 'Logo'),
}))

vi.mock('../../../utils/animations', () => ({
  scrollReveal: { hidden: {}, visible: {} },
}))

import { ComparisonSection } from '../ComparisonSection'

describe('ComparisonSection', () => {
  // ─── Basic rendering ────────────────────────────────────

  it('renders the section with correct aria-label', () => {
    render(<ComparisonSection />)
    expect(screen.getByLabelText('Comparaison avec Discord')).toBeInTheDocument()
  })

  it('renders heading and subtitle', () => {
    render(<ComparisonSection />)
    expect(screen.getByText("Plus qu'un Discord pour gamers")).toBeInTheDocument()
    expect(screen.getByText(/Discord est fait pour discuter/)).toBeInTheDocument()
    expect(screen.getByText('jouer ensemble')).toBeInTheDocument()
  })

  it('renders footer note text', () => {
    render(<ComparisonSection />)
    expect(screen.getByText(/Discord reste indispensable/)).toBeInTheDocument()
    expect(screen.getByText(/squad de 3 à 10 joueurs/)).toBeInTheDocument()
  })

  // ─── Table structure ────────────────────────────────────

  it('renders a table element', () => {
    render(<ComparisonSection />)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renders accessible table caption', () => {
    render(<ComparisonSection />)
    expect(
      screen.getByText('Comparaison des fonctionnalités entre Discord et Squad Planner')
    ).toBeInTheDocument()
  })

  it('renders table column headers', () => {
    render(<ComparisonSection />)
    expect(screen.getByText('Fonctionnalité')).toBeInTheDocument()
    expect(screen.getByText('SP')).toBeInTheDocument()
  })

  it('renders Discord icon in header', () => {
    const { container } = render(<ComparisonSection />)
    const svgs = container.querySelectorAll('svg')
    // The DiscordIcon is an inline SVG with fill="#5865F2"
    const discordSvg = Array.from(svgs).find((svg) => svg.getAttribute('fill') === '#5865F2')
    expect(discordSvg).toBeTruthy()
  })

  it('renders SquadPlannerLogo in header with size 14', () => {
    render(<ComparisonSection />)
    const logo = screen.getByTestId('sp-logo')
    expect(logo).toBeInTheDocument()
    expect(logo.getAttribute('data-size')).toBe('14')
  })

  // ─── All 7 feature rows ────────────────────────────────

  it('renders all 7 comparison features', () => {
    render(<ComparisonSection />)
    expect(screen.getByText('Planning de sessions avec confirmation')).toBeInTheDocument()
    expect(screen.getByText('Score de fiabilité par joueur')).toBeInTheDocument()
    expect(screen.getByText('Check-in présence réelle')).toBeInTheDocument()
    expect(screen.getByText('Coach IA personnalisé')).toBeInTheDocument()
    expect(screen.getByText('Party vocale dédiée')).toBeInTheDocument()
    expect(screen.getByText('Chat de squad')).toBeInTheDocument()
    expect(screen.getByText('Gamification (XP, challenges)')).toBeInTheDocument()
  })

  it('renders exactly 7 table body rows', () => {
    render(<ComparisonSection />)
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    // 1 header row + 7 body rows = 8 total
    expect(rows.length).toBe(8)
  })

  // ─── Discord column: false values (X icons) ────────────

  it('renders X icons for features Discord does not have', () => {
    render(<ComparisonSection />)
    // 4 features where discord === false: Planning confirmation, Score fiabilité, Check-in, Coach IA
    const xIcons = screen.getAllByTestId('icon-x')
    expect(xIcons.length).toBe(4)
  })

  it('renders "Non disponible" sr-only text for features Discord lacks', () => {
    render(<ComparisonSection />)
    const nonDispos = screen.getAllByText('Non disponible')
    expect(nonDispos.length).toBe(4)
  })

  // ─── Discord column: true values (Check icons with notes) ──

  it('renders Check icons for features Discord has', () => {
    render(<ComparisonSection />)
    // Check icons: in Discord column for Party vocale (true) and Chat de squad (true)
    // plus all 7 in SP column = total checks should be 2 Discord + 7 SP = 9
    // plus Gamification has 'partial' so no Check there for discord
    const checkIcons = screen.getAllByTestId('icon-check')
    expect(checkIcons.length).toBe(9) // 2 discord true + 7 squad true
  })

  it('renders "Basique" note for Discord Party vocale and Chat', () => {
    render(<ComparisonSection />)
    const basiques = screen.getAllByText('Basique')
    // Party vocale and Chat de squad both have discordNote: 'Basique'
    expect(basiques.length).toBe(2)
  })

  // ─── Discord column: partial value ──────────────────────

  it('renders partial badge for Gamification in Discord column', () => {
    render(<ComparisonSection />)
    expect(screen.getByText('Via bots tiers')).toBeInTheDocument()
  })

  it('partial badge has warning styling', () => {
    render(<ComparisonSection />)
    const badge = screen.getByText('Via bots tiers')
    expect(badge.className).toContain('text-warning')
    expect(badge.className).toContain('bg-warning/10')
  })

  // ─── Squad Planner column: all true ─────────────────────

  it('renders "Disponible" sr-only text for features without squadNote', () => {
    render(<ComparisonSection />)
    // Features without squadNote: Planning, Score, Check-in, Coach IA (4 items)
    // Plus Discord "Disponible" sr-only for discord===true without discordNote: none (both have notes)
    // Total "Disponible" = 4 from SP + 0 from discord true with no note
    const disponibles = screen.getAllByText('Disponible')
    expect(disponibles.length).toBe(4) // 4 SP features w/o squadNote
  })

  it('renders "Optimisé gaming" notes for Squad Planner', () => {
    render(<ComparisonSection />)
    const optimised = screen.getAllByText('Optimisé gaming')
    // Party vocale and Chat de squad in SP column
    expect(optimised.length).toBe(2)
  })

  it('renders "Natif" note for Squad Planner Gamification', () => {
    render(<ComparisonSection />)
    expect(screen.getByText('Natif')).toBeInTheDocument()
  })

  // ─── Row styling: conditional background ────────────────

  it('applies primary background to rows where Discord is false', () => {
    const { container } = render(<ComparisonSection />)
    const tbody = container.querySelector('tbody')!
    const rows = tbody.querySelectorAll('tr')
    // Rows 0,1,2,3 (discord===false) should have bg-primary/[0.02]
    expect(rows[0].className).toContain('bg-primary')
    expect(rows[1].className).toContain('bg-primary')
    expect(rows[2].className).toContain('bg-primary')
    expect(rows[3].className).toContain('bg-primary')
  })

  it('does NOT apply primary background to rows where Discord is true', () => {
    const { container } = render(<ComparisonSection />)
    const tbody = container.querySelector('tbody')!
    const rows = tbody.querySelectorAll('tr')
    // Rows 4,5 (discord===true) should NOT have bg-primary
    expect(rows[4].className).not.toContain('bg-primary')
    expect(rows[5].className).not.toContain('bg-primary')
  })

  // ─── Row borders: last row has no border ────────────────

  it('applies border to non-last rows', () => {
    const { container } = render(<ComparisonSection />)
    const tbody = container.querySelector('tbody')!
    const rows = tbody.querySelectorAll('tr')
    expect(rows[0].className).toContain('border-b')
    expect(rows[5].className).toContain('border-b')
  })

  it('does NOT apply border to last row', () => {
    const { container } = render(<ComparisonSection />)
    const tbody = container.querySelector('tbody')!
    const rows = tbody.querySelectorAll('tr')
    // Last row (index 6) should not have border-b
    expect(rows[6].className).not.toContain('border-b')
  })

  // ─── DiscordIcon internal render ────────────────────────

  it('DiscordIcon has aria-hidden', () => {
    const { container } = render(<ComparisonSection />)
    const discordSvg = container.querySelector('svg[fill="#5865F2"]')
    expect(discordSvg?.getAttribute('aria-hidden')).toBe('true')
  })

  it('DiscordIcon has correct viewBox', () => {
    const { container } = render(<ComparisonSection />)
    const discordSvg = container.querySelector('svg[fill="#5865F2"]')
    expect(discordSvg?.getAttribute('viewBox')).toBe('0 0 256 199')
  })
})
