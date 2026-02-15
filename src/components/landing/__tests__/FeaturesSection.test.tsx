import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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

vi.mock('../../icons', () => new Proxy({}, {
  get: (_t, p) => typeof p === 'string' ? (props: any) => createElement('span', { ...props, 'data-testid': `icon-${String(p)}` }, String(p)) : undefined,
}))

vi.mock('../illustrations/HeadphonesIllustration', () => ({ HeadphonesIllustration: ({ size }: any) => createElement('span', { 'data-testid': 'headphones-illust', 'data-size': size }, 'headphones') }))
vi.mock('../illustrations/CalendarIllustration', () => ({ CalendarIllustration: ({ size }: any) => createElement('span', { 'data-testid': 'calendar-illust', 'data-size': size }, 'calendar') }))
vi.mock('../illustrations/ShieldIllustration', () => ({ ShieldIllustration: ({ size }: any) => createElement('span', { 'data-testid': 'shield-illust', 'data-size': size }, 'shield') }))

import { FeaturesSection } from '../FeaturesSection'

describe('FeaturesSection', () => {
  // ─── Basic rendering ────────────────────────────────────

  it('renders the section with correct aria-label', () => {
    render(<FeaturesSection />)
    expect(screen.getByLabelText('Fonctionnalités principales')).toBeInTheDocument()
  })

  it('renders the heading and subtitle', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('Les 3 piliers de Squad Planner')).toBeInTheDocument()
    expect(screen.getByText('Chacun résout un problème précis. Ensemble, ils font la différence.')).toBeInTheDocument()
  })

  it('renders footer text about Discord', () => {
    render(<FeaturesSection />)
    expect(screen.getByText(/habitudes de jeu régulières/)).toBeInTheDocument()
    expect(screen.getByText(/Plus qu'un simple Discord/)).toBeInTheDocument()
  })

  // ─── Pillar tabs ─────────────────────────────────────────

  it('renders all three pillar tab buttons', () => {
    render(<FeaturesSection />)
    const buttons = screen.getAllByRole('button')
    // 3 tab buttons
    expect(buttons.length).toBe(3)
    expect(screen.getByText('Party vocale 24/7')).toBeInTheDocument()
    expect(screen.getByText('Planning avec décision')).toBeInTheDocument()
    expect(screen.getByText('Fiabilité mesurée')).toBeInTheDocument()
  })

  it('renders each tab button with its icon', () => {
    render(<FeaturesSection />)
    // Icons are rendered inside buttons: Headphones, Calendar, Target
    expect(screen.getAllByTestId('icon-Headphones').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTestId('icon-Calendar').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTestId('icon-Target').length).toBeGreaterThanOrEqual(1)
  })

  // ─── Default active pillar (voice, index 0) ─────────────

  it('shows voice pillar detail by default', () => {
    render(<FeaturesSection />)
    expect(screen.getByText(/Ta squad a son salon vocal 24\/7/)).toBeInTheDocument()
  })

  it('renders voice detail items', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('1 squad = 1 party vocale dédiée')).toBeInTheDocument()
    expect(screen.getByText('Rejoindre en 1 clic')).toBeInTheDocument()
    expect(screen.getByText('Qualité HD, latence ultra-faible')).toBeInTheDocument()
  })

  it('renders Check icons for each detail item', () => {
    render(<FeaturesSection />)
    // 3 details with a Check icon each
    const checks = screen.getAllByTestId('icon-Check')
    expect(checks.length).toBe(3)
  })

  it('renders VoiceMockup when voice pillar is active', () => {
    render(<FeaturesSection />)
    // VoiceMockup renders "Party vocale" and "En ligne" texts
    expect(screen.getByText('En ligne')).toBeInTheDocument()
  })

  it('renders voice mockup user avatars with initials', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('M')).toBeInTheDocument() // Max's initial
    expect(screen.getByText('L')).toBeInTheDocument() // Luna
    expect(screen.getByText('K')).toBeInTheDocument() // Kira
    expect(screen.getByText('J')).toBeInTheDocument() // Jay
  })

  it('renders voice mockup user names', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('Max')).toBeInTheDocument()
    expect(screen.getByText('Luna')).toBeInTheDocument()
    expect(screen.getByText('Kira')).toBeInTheDocument()
    expect(screen.getByText('Jay')).toBeInTheDocument()
  })

  it('renders speaking indicator only for Max', () => {
    const { container } = render(<FeaturesSection />)
    // Max is the only one with speaking=true, which adds ring-2 ring-success/50
    const maxAvatar = container.querySelector('.ring-2')
    expect(maxAvatar).not.toBeNull()
    expect(maxAvatar?.textContent).toBe('M')
  })

  it('renders 7 waveform bars in voice mockup', () => {
    const { container } = render(<FeaturesSection />)
    // 7 bars with w-0.5 class inside the voice mockup
    const bars = container.querySelectorAll('.bg-success.rounded-full')
    // The bars have bg-success and rounded-full classes
    expect(bars.length).toBeGreaterThanOrEqual(7)
  })

  it('renders HeadphonesIllustration with size 40 in voice detail', () => {
    render(<FeaturesSection />)
    const illust = screen.getByTestId('headphones-illust')
    expect(illust).toBeInTheDocument()
    expect(illust.getAttribute('data-size')).toBe('40')
  })

  // ─── Active tab styling ──────────────────────────────────

  it('applies active styles to the first tab by default', () => {
    render(<FeaturesSection />)
    const voiceButton = screen.getByText('Party vocale 24/7').closest('button')!
    // Active tab has inline style with backgroundColor
    expect(voiceButton.style.backgroundColor).toBeTruthy()
    expect(voiceButton.style.borderColor).toBeTruthy()
  })

  it('does not apply active inline styles to inactive tabs', () => {
    render(<FeaturesSection />)
    const planningButton = screen.getByText('Planning avec décision').closest('button')!
    // Inactive tabs should not have inline backgroundColor
    expect(planningButton.style.backgroundColor).toBeFalsy()
  })

  // ─── Switching to planning pillar (index 1) ─────────────

  it('switches to planning pillar on click', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Planning avec décision'))

    // Planning detail text
    expect(screen.getByText(/Propose un créneau\. Chaque pote répond OUI ou NON/)).toBeInTheDocument()
  })

  it('shows planning detail items after click', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Planning avec décision'))

    expect(screen.getByText(/RSVP OUI ou NON/)).toBeInTheDocument()
    expect(screen.getByText('Confirmation auto quand assez de joueurs')).toBeInTheDocument()
    expect(screen.getByText('Rappels avant chaque session')).toBeInTheDocument()
  })

  it('shows CalendarIllustration when planning pillar is active', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Planning avec décision'))

    expect(screen.getByTestId('calendar-illust')).toBeInTheDocument()
  })

  it('does NOT show VoiceMockup when planning pillar is active', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Planning avec décision'))

    // "En ligne" only appears inside VoiceMockup
    expect(screen.queryByText('En ligne')).not.toBeInTheDocument()
  })

  it('hides voice detail text after switching to planning', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Planning avec décision'))

    expect(screen.queryByText(/Ta squad a son salon vocal 24\/7/)).not.toBeInTheDocument()
  })

  // ─── Switching to reliability pillar (index 2) ───────────

  it('switches to reliability pillar on click', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Fiabilité mesurée'))

    expect(screen.getByText(/Chaque membre a un score basé sur sa présence réelle/)).toBeInTheDocument()
  })

  it('shows reliability detail items', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Fiabilité mesurée'))

    expect(screen.getByText('Check-in obligatoire')).toBeInTheDocument()
    expect(screen.getByText('Historique visible')).toBeInTheDocument()
    expect(screen.getByText('Score par joueur')).toBeInTheDocument()
  })

  it('shows ShieldIllustration when reliability pillar is active', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Fiabilité mesurée'))

    expect(screen.getByTestId('shield-illust')).toBeInTheDocument()
  })

  it('does NOT show VoiceMockup when reliability pillar is active', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Fiabilité mesurée'))

    expect(screen.queryByText('En ligne')).not.toBeInTheDocument()
  })

  // ─── Switching back to voice after visiting another ──────

  it('switches back to voice pillar and restores VoiceMockup', () => {
    render(<FeaturesSection />)
    // Go to planning
    fireEvent.click(screen.getByText('Planning avec décision'))
    expect(screen.queryByText('En ligne')).not.toBeInTheDocument()

    // Go back to voice
    fireEvent.click(screen.getByText('Party vocale 24/7'))
    expect(screen.getByText('En ligne')).toBeInTheDocument()
    expect(screen.getByText(/Ta squad a son salon vocal 24\/7/)).toBeInTheDocument()
  })

  // ─── Each pillar renders only its own detail ─────────────

  it('only renders one detail card at a time', () => {
    render(<FeaturesSection />)
    // default: voice active
    expect(screen.getByText('1 squad = 1 party vocale dédiée')).toBeInTheDocument()
    expect(screen.queryByText('Confirmation auto quand assez de joueurs')).not.toBeInTheDocument()
    expect(screen.queryByText('Check-in obligatoire')).not.toBeInTheDocument()
  })

  // ─── Full cycle through all pillars ──────────────────────

  it('can cycle through all three pillars', () => {
    render(<FeaturesSection />)

    // voice (default)
    expect(screen.getByText('1 squad = 1 party vocale dédiée')).toBeInTheDocument()

    // planning
    fireEvent.click(screen.getByText('Planning avec décision'))
    expect(screen.getByText('Confirmation auto quand assez de joueurs')).toBeInTheDocument()

    // reliability
    fireEvent.click(screen.getByText('Fiabilité mesurée'))
    expect(screen.getByText('Check-in obligatoire')).toBeInTheDocument()

    // back to voice
    fireEvent.click(screen.getByText('Party vocale 24/7'))
    expect(screen.getByText('Rejoindre en 1 clic')).toBeInTheDocument()
  })

  // ─── Active tab style update after switching ─────────────

  it('updates active style when switching tabs', () => {
    render(<FeaturesSection />)
    const voiceBtn = screen.getByText('Party vocale 24/7').closest('button')!
    const planningBtn = screen.getByText('Planning avec décision').closest('button')!

    // Initially voice is active
    expect(voiceBtn.style.backgroundColor).toBeTruthy()
    expect(planningBtn.style.backgroundColor).toBeFalsy()

    // Click planning
    fireEvent.click(planningBtn)

    // Now planning is active, voice is not
    expect(planningBtn.style.backgroundColor).toBeTruthy()
    expect(voiceBtn.style.backgroundColor).toBeFalsy()
  })

  // ─── Pillar detail title matches tab title ───────────────

  it('renders the pillar title in the detail card', () => {
    render(<FeaturesSection />)
    // The h3 inside detail card should show 'Party vocale 24/7'
    const headings = screen.getAllByText('Party vocale 24/7')
    // One in the tab, one in the detail card
    expect(headings.length).toBe(2)
  })

  it('renders planning title in detail card after click', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Planning avec décision'))
    const headings = screen.getAllByText('Planning avec décision')
    expect(headings.length).toBe(2)
  })
})
