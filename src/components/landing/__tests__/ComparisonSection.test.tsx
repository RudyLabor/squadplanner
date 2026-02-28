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
    expect(screen.getByText('Ce que Discord ne fait pas pour ta squad')).toBeInTheDocument()
    expect(screen.getByText(/Tu utilises Discord pour discuter/)).toBeInTheDocument()
    expect(screen.getByText('enfin jouer')).toBeInTheDocument()
  })

  it('renders footer note text', () => {
    render(<ComparisonSection />)
    expect(screen.getByText(/Discord gère tes serveurs/)).toBeInTheDocument()
    expect(screen.getByText(/combinaison parfaite/)).toBeInTheDocument()
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

  // ─── All 11 feature rows ────────────────────────────────

  it('renders all 11 comparison features', () => {
    render(<ComparisonSection />)
    expect(screen.getByText('Planning de sessions avec confirmation')).toBeInTheDocument()
    expect(screen.getByText('Score de fiabilité par joueur')).toBeInTheDocument()
    expect(screen.getByText('Check-in présence réelle')).toBeInTheDocument()
    expect(screen.getByText('Coach IA personnalisé')).toBeInTheDocument()
    expect(screen.getByText("Stats & analytics d'équipe")).toBeInTheDocument()
    expect(screen.getByText('Sessions récurrentes')).toBeInTheDocument()
    expect(screen.getByText('Gestion multi-squads')).toBeInTheDocument()
    expect(screen.getByText('Party vocale dédiée')).toBeInTheDocument()
    expect(screen.getByText('Chat de squad')).toBeInTheDocument()
    expect(screen.getByText('Gamification (XP, challenges)')).toBeInTheDocument()
    expect(screen.getByText('Parrainage avec récompenses')).toBeInTheDocument()
  })

  it('renders exactly 11 table body rows', () => {
    render(<ComparisonSection />)
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    // 1 header row + 11 body rows = 12 total
    expect(rows.length).toBe(12)
  })

  // ─── Discord column: false values (X icons) ────────────

  it('renders X icons for features Discord does not have', () => {
    render(<ComparisonSection />)
    // 7 features where discord === false: Planning, Score, Check-in, Coach IA, Stats, Sessions récurrentes, Parrainage
    const xIcons = screen.getAllByTestId('icon-x')
    expect(xIcons.length).toBe(7)
  })

  it('renders "Non disponible" sr-only text for features Discord lacks', () => {
    render(<ComparisonSection />)
    const nonDispos = screen.getAllByText('Non disponible')
    expect(nonDispos.length).toBe(7)
  })

  // ─── Discord column: true values (Check icons with notes) ──

  it('renders Check icons for features Discord has and all SP features', () => {
    render(<ComparisonSection />)
    // Check icons: in Discord column for Party vocale (true) and Chat de squad (true) = 2
    // plus all 11 in SP column = 11
    // Total = 2 Discord true + 11 SP true = 13
    const checkIcons = screen.getAllByTestId('icon-check')
    expect(checkIcons.length).toBe(13)
  })

  it('renders "Basique" note for Discord Party vocale and Chat', () => {
    render(<ComparisonSection />)
    const basiques = screen.getAllByText('Basique')
    // Party vocale and Chat de squad both have discordNote: 'Basique'
    expect(basiques.length).toBe(2)
  })

  // ─── Discord column: partial value ──────────────────────

  it('renders partial badges for Discord column', () => {
    render(<ComparisonSection />)
    expect(screen.getByText('Via bots tiers')).toBeInTheDocument()
    expect(screen.getByText('Serveurs séparés')).toBeInTheDocument()
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
    // Features without squadNote in SP column: Planning, Score, Check-in, Coach IA, Sessions récurrentes (5 items)
    // Plus Discord "Disponible" sr-only for discord===true without discordNote: none (both have notes)
    // Total "Disponible" = 5 from SP + 0 from discord true with no note
    const disponibles = screen.getAllByText('Disponible')
    expect(disponibles.length).toBe(5)
  })

  it('renders "Optimisé gaming" note for Squad Planner Chat', () => {
    render(<ComparisonSection />)
    const optimised = screen.getAllByText('Optimisé gaming')
    // Only Chat de squad in SP column has "Optimisé gaming"
    expect(optimised.length).toBe(1)
  })

  it('renders "Audio HD" note for Squad Planner Party vocale', () => {
    render(<ComparisonSection />)
    expect(screen.getByText('Audio HD')).toBeInTheDocument()
  })

  it('renders "Natif" notes for Squad Planner Gamification and Parrainage', () => {
    render(<ComparisonSection />)
    const natifs = screen.getAllByText('Natif')
    expect(natifs.length).toBe(2)
  })

  // ─── Row styling: conditional background ────────────────

  it('applies primary background to rows where Discord is false', () => {
    const { container } = render(<ComparisonSection />)
    const tbody = container.querySelector('tbody')!
    const rows = tbody.querySelectorAll('tr')
    // Rows 0-5 (discord===false) and row 10 (Parrainage, discord===false) should have bg-primary
    expect(rows[0].className).toContain('bg-primary')
    expect(rows[1].className).toContain('bg-primary')
    expect(rows[2].className).toContain('bg-primary')
    expect(rows[3].className).toContain('bg-primary')
    expect(rows[4].className).toContain('bg-primary')
    expect(rows[5].className).toContain('bg-primary')
    expect(rows[10].className).toContain('bg-primary')
  })

  it('does NOT apply primary background to rows where Discord is true or partial', () => {
    const { container } = render(<ComparisonSection />)
    const tbody = container.querySelector('tbody')!
    const rows = tbody.querySelectorAll('tr')
    // Rows 6 (Gestion multi-squads, partial), 7 (Party, true), 8 (Chat, true), 9 (Gamification, partial)
    expect(rows[6].className).not.toContain('bg-primary')
    expect(rows[7].className).not.toContain('bg-primary')
    expect(rows[8].className).not.toContain('bg-primary')
    expect(rows[9].className).not.toContain('bg-primary')
  })

  // ─── Row borders: last row has no border ────────────────

  it('applies border to non-last rows', () => {
    const { container } = render(<ComparisonSection />)
    const tbody = container.querySelector('tbody')!
    const rows = tbody.querySelectorAll('tr')
    expect(rows[0].className).toContain('border-b')
    expect(rows[9].className).toContain('border-b')
  })

  it('does NOT apply border to last row', () => {
    const { container } = render(<ComparisonSection />)
    const tbody = container.querySelector('tbody')!
    const rows = tbody.querySelectorAll('tr')
    // Last row (index 10) should not have border-b
    expect(rows[10].className).not.toContain('border-b')
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
