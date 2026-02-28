import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

vi.mock('../illustrations/HeadphonesIllustration', () => ({
  HeadphonesIllustration: ({ size }: any) =>
    createElement('span', { 'data-testid': 'headphones-illust', 'data-size': size }, 'headphones'),
}))
vi.mock('../illustrations/CalendarIllustration', () => ({
  CalendarIllustration: ({ size }: any) =>
    createElement('span', { 'data-testid': 'calendar-illust', 'data-size': size }, 'calendar'),
}))
vi.mock('../illustrations/ShieldIllustration', () => ({
  ShieldIllustration: ({ size }: any) =>
    createElement('span', { 'data-testid': 'shield-illust', 'data-size': size }, 'shield'),
}))

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
    expect(
      screen.getByText('Chacun résout un problème précis. Ensemble, ils font la différence.')
    ).toBeInTheDocument()
  })

  it('renders footer text about Discord', () => {
    render(<FeaturesSection />)
    expect(screen.getByText(/habitudes de jeu régulières/)).toBeInTheDocument()
    expect(screen.getByText(/Plus qu'un simple Discord/)).toBeInTheDocument()
  })

  it('renders all three pillar tab buttons', () => {
    render(<FeaturesSection />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(3)
    expect(screen.getByText('Party vocale 24/7')).toBeInTheDocument()
    expect(screen.getByText('Planning intelligent')).toBeInTheDocument()
    expect(screen.getByText('Fiabilité mesurée')).toBeInTheDocument()
  })

  it('renders each tab button with its icon', () => {
    render(<FeaturesSection />)
    expect(screen.getAllByTestId('icon-Headphones').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTestId('icon-Calendar').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTestId('icon-Target').length).toBeGreaterThanOrEqual(1)
  })

  it('shows voice pillar detail by default with detail text and items', () => {
    render(<FeaturesSection />)
    expect(screen.getByText(/Ta squad a son salon vocal 24\/7/)).toBeInTheDocument()
    expect(screen.getByText('1 squad = 1 party vocale dédiée')).toBeInTheDocument()
    expect(screen.getByText('Rejoindre en 1 clic')).toBeInTheDocument()
    expect(screen.getByText('Qualité HD, latence ultra-faible')).toBeInTheDocument()
  })

  it('renders Check icons for detail items and VoiceMockup when voice is active', () => {
    render(<FeaturesSection />)
    const checks = screen.getAllByTestId('icon-Check')
    expect(checks.length).toBe(3)
    expect(screen.getByText('En ligne')).toBeInTheDocument()
    expect(screen.getByText('Max')).toBeInTheDocument()
    expect(screen.getByText('Luna')).toBeInTheDocument()
    expect(screen.getByText('Kira')).toBeInTheDocument()
    expect(screen.getByText('Jay')).toBeInTheDocument()
  })

  it('renders speaking indicator only for Max and HeadphonesIllustration', () => {
    const { container } = render(<FeaturesSection />)
    const maxAvatar = container.querySelector('.ring-2')
    expect(maxAvatar).not.toBeNull()
    expect(maxAvatar?.textContent).toBe('M')
    const illust = screen.getByTestId('headphones-illust')
    expect(illust.getAttribute('data-size')).toBe('40')
  })

  it('applies active styles to the first tab and not to inactive tabs', () => {
    render(<FeaturesSection />)
    const voiceButton = screen.getByText('Party vocale 24/7').closest('button')!
    const planningButton = screen.getByText('Planning intelligent').closest('button')!
    expect(voiceButton.style.backgroundColor).toBeTruthy()
    expect(planningButton.style.backgroundColor).toBeFalsy()
  })

  it('switches to planning pillar on click and shows correct details', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Planning intelligent'))
    expect(
      screen.getByText(/Propose un créneau\. Chaque pote répond OUI ou NON/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Confirme ta présence OUI ou NON/)).toBeInTheDocument()
    expect(screen.getByText('Confirmation auto quand assez de joueurs')).toBeInTheDocument()
    expect(screen.getByText('Rappels avant chaque session')).toBeInTheDocument()
    expect(screen.getByTestId('calendar-illust')).toBeInTheDocument()
    expect(screen.queryByText('En ligne')).not.toBeInTheDocument()
    expect(screen.queryByText(/Ta squad a son salon vocal 24\/7/)).not.toBeInTheDocument()
  })

  it('switches to reliability pillar on click and shows correct details', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Fiabilité mesurée'))
    expect(
      screen.getByText(/Chaque membre a un score basé sur sa présence réelle/)
    ).toBeInTheDocument()
    expect(screen.getByText('Check-in obligatoire')).toBeInTheDocument()
    expect(screen.getByText('Historique visible')).toBeInTheDocument()
    expect(screen.getByText('Score par joueur')).toBeInTheDocument()
    expect(screen.getByTestId('shield-illust')).toBeInTheDocument()
    expect(screen.queryByText('En ligne')).not.toBeInTheDocument()
  })

  it('switches back to voice pillar and restores VoiceMockup', () => {
    render(<FeaturesSection />)
    fireEvent.click(screen.getByText('Planning intelligent'))
    expect(screen.queryByText('En ligne')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Party vocale 24/7'))
    expect(screen.getByText('En ligne')).toBeInTheDocument()
    expect(screen.getByText(/Ta squad a son salon vocal 24\/7/)).toBeInTheDocument()
  })

  it('only renders one detail card at a time', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('1 squad = 1 party vocale dédiée')).toBeInTheDocument()
    expect(screen.queryByText('Confirmation auto quand assez de joueurs')).not.toBeInTheDocument()
    expect(screen.queryByText('Check-in obligatoire')).not.toBeInTheDocument()
  })

  it('can cycle through all three pillars', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('1 squad = 1 party vocale dédiée')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Planning intelligent'))
    expect(screen.getByText('Confirmation auto quand assez de joueurs')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Fiabilité mesurée'))
    expect(screen.getByText('Check-in obligatoire')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Party vocale 24/7'))
    expect(screen.getByText('Rejoindre en 1 clic')).toBeInTheDocument()
  })

  it('updates active style when switching tabs', () => {
    render(<FeaturesSection />)
    const voiceBtn = screen.getByText('Party vocale 24/7').closest('button')!
    const planningBtn = screen.getByText('Planning intelligent').closest('button')!
    expect(voiceBtn.style.backgroundColor).toBeTruthy()
    expect(planningBtn.style.backgroundColor).toBeFalsy()
    fireEvent.click(planningBtn)
    expect(planningBtn.style.backgroundColor).toBeTruthy()
    expect(voiceBtn.style.backgroundColor).toBeFalsy()
  })

  it('renders the pillar title in both tab and detail card', () => {
    render(<FeaturesSection />)
    const headings = screen.getAllByText('Party vocale 24/7')
    expect(headings.length).toBe(2)
    fireEvent.click(screen.getByText('Planning intelligent'))
    expect(screen.getAllByText('Planning intelligent').length).toBe(2)
  })

  it('renders voice mockup user avatars with initials and names', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('K')).toBeInTheDocument()
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders waveform bars in voice mockup', () => {
    const { container } = render(<FeaturesSection />)
    const bars = container.querySelectorAll('.bg-success.rounded-full')
    expect(bars.length).toBeGreaterThanOrEqual(7)
  })
})
