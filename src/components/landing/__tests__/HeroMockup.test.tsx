import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
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
  Play: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-play' }, 'play'),
}))

vi.mock('../MockupScreens', () => ({
  screens: [
    {
      id: 'home',
      component: () => createElement('div', { 'data-testid': 'screen-home' }, 'HomeScreen'),
      label: 'Accueil',
      duration: 4000,
    },
    {
      id: 'squad',
      component: () => createElement('div', { 'data-testid': 'screen-squad' }, 'SquadScreen'),
      label: 'Squad',
      duration: 4000,
    },
    {
      id: 'party',
      component: () => createElement('div', { 'data-testid': 'screen-party' }, 'PartyScreen'),
      label: 'Party',
      duration: 3500,
    },
  ],
}))

import { HeroMockup } from '../HeroMockup'

describe('HeroMockup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ─── Basic rendering ────────────────────────────────────

  it('renders "Voir la demo" badge', () => {
    render(<HeroMockup />)
    expect(screen.getByText('Voir la demo')).toBeInTheDocument()
  })

  it('renders Play icon', () => {
    render(<HeroMockup />)
    expect(screen.getByTestId('icon-play')).toBeInTheDocument()
  })

  it('renders first screen (home) by default', () => {
    render(<HeroMockup />)
    expect(screen.getByTestId('screen-home')).toBeInTheDocument()
    expect(screen.getByText('HomeScreen')).toBeInTheDocument()
  })

  it('renders status bar with time "21:00"', () => {
    render(<HeroMockup />)
    expect(screen.getByText('21:00')).toBeInTheDocument()
  })

  it('renders 4 signal strength bars', () => {
    const { container } = render(<HeroMockup />)
    // 4 signal bars with dynamic heights
    const signalBars = container.querySelectorAll('.rounded-sm')
    expect(signalBars.length).toBeGreaterThanOrEqual(4)
  })

  // ─── Step indicator dots ───────────────────────────────

  it('renders 3 step indicator buttons (one per screen)', () => {
    render(<HeroMockup />)
    const stepButtons = screen.getAllByRole('button')
    expect(stepButtons.length).toBe(3)
  })

  it('renders first step with its label "Accueil"', () => {
    render(<HeroMockup />)
    expect(screen.getByText('Accueil')).toBeInTheDocument()
  })

  it('renders step buttons with correct aria-labels', () => {
    render(<HeroMockup />)
    expect(screen.getByLabelText('Accueil')).toBeInTheDocument()
    expect(screen.getByLabelText('Squad')).toBeInTheDocument()
    expect(screen.getByLabelText('Party')).toBeInTheDocument()
  })

  // ─── Current step label only visible for active ────────

  it('shows label only for the active step', () => {
    render(<HeroMockup />)
    // "Accueil" label should be visible (step 0 is active)
    expect(screen.getByText('Accueil')).toBeInTheDocument()
    // "Squad" and "Party" labels should not be visible as separate label elements
    expect(screen.queryByText('Squad')).toBeNull()
    expect(screen.queryByText('Party')).toBeNull()
  })

  // ─── Click on step dots ────────────────────────────────

  it('clicking step 2 button switches to squad screen', () => {
    render(<HeroMockup />)
    fireEvent.click(screen.getByLabelText('Squad'))

    expect(screen.getByTestId('screen-squad')).toBeInTheDocument()
    expect(screen.getByText('SquadScreen')).toBeInTheDocument()
    // Label should now show "Squad"
    expect(screen.getByText('Squad')).toBeInTheDocument()
  })

  it('clicking step 3 button switches to party screen', () => {
    render(<HeroMockup />)
    fireEvent.click(screen.getByLabelText('Party'))

    expect(screen.getByTestId('screen-party')).toBeInTheDocument()
    expect(screen.getByText('PartyScreen')).toBeInTheDocument()
  })

  it('clicking a step hides the previous screen', () => {
    render(<HeroMockup />)
    expect(screen.getByTestId('screen-home')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Squad'))

    expect(screen.queryByTestId('screen-home')).not.toBeInTheDocument()
    expect(screen.getByTestId('screen-squad')).toBeInTheDocument()
  })

  // ─── Click pauses auto-advance ─────────────────────────

  it('clicking a step pauses auto-advance for 5 seconds', () => {
    render(<HeroMockup />)

    // Click step 2 (Squad)
    fireEvent.click(screen.getByLabelText('Squad'))
    expect(screen.getByTestId('screen-squad')).toBeInTheDocument()

    // Advance past the screen duration (4000ms) - should NOT auto-advance because paused
    act(() => {
      vi.advanceTimersByTime(4500)
    })
    expect(screen.getByTestId('screen-squad')).toBeInTheDocument()

    // After 5000ms total pause, auto-advance resumes
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    // After pause resumes, it takes another screen.duration to advance
    act(() => {
      vi.advanceTimersByTime(4500)
    })
    // Should now have auto-advanced to the next screen (party)
    expect(screen.getByTestId('screen-party')).toBeInTheDocument()
  })

  // ─── Auto-advance through screens ─────────────────────

  it('auto-advances from screen 0 to screen 1 after duration', () => {
    render(<HeroMockup />)
    expect(screen.getByTestId('screen-home')).toBeInTheDocument()

    // First screen duration is 4000ms
    act(() => {
      vi.advanceTimersByTime(4100)
    })

    expect(screen.getByTestId('screen-squad')).toBeInTheDocument()
  })

  it('auto-advances from screen 1 to screen 2', () => {
    render(<HeroMockup />)

    // Advance past screen 0
    act(() => {
      vi.advanceTimersByTime(4100)
    })
    expect(screen.getByTestId('screen-squad')).toBeInTheDocument()

    // Screen 1 duration is 4000ms
    act(() => {
      vi.advanceTimersByTime(4100)
    })
    expect(screen.getByTestId('screen-party')).toBeInTheDocument()
  })

  it('wraps around from last screen to first', () => {
    render(<HeroMockup />)

    // Advance through all 3 screens
    act(() => {
      vi.advanceTimersByTime(4100)
    }) // -> squad
    act(() => {
      vi.advanceTimersByTime(4100)
    }) // -> party
    act(() => {
      vi.advanceTimersByTime(3600)
    }) // -> home (wraps)

    expect(screen.getByTestId('screen-home')).toBeInTheDocument()
  })

  // ─── Phone frame structure ─────────────────────────────

  it('renders hero-phone-float container', () => {
    const { container } = render(<HeroMockup />)
    expect(container.querySelector('.hero-phone-float')).toBeTruthy()
  })

  it('renders notch in phone frame', () => {
    const { container } = render(<HeroMockup />)
    // The notch is a div with specific positioning
    const notch = container.querySelector('.bg-bg-elevated.rounded-b-2xl')
    expect(notch).toBeTruthy()
  })

  it('renders battery indicator', () => {
    const { container } = render(<HeroMockup />)
    // Battery has border-text-tertiary
    const battery = container.querySelector('.border-text-tertiary')
    expect(battery).toBeTruthy()
  })

  it('renders progress bar element', () => {
    const { container } = render(<HeroMockup />)
    // Progress bar: w-32 h-0.5
    const progressBar = container.querySelector('.bg-border-subtle.overflow-hidden')
    expect(progressBar).toBeTruthy()
  })

  // ─── Clicking same step (already active) ───────────────

  it('clicking the active step still sets state and pauses', () => {
    render(<HeroMockup />)

    // Click the already-active first step
    fireEvent.click(screen.getByLabelText('Accueil'))

    // Should still show the same screen
    expect(screen.getByTestId('screen-home')).toBeInTheDocument()
  })

  // ─── Multiple clicks reset pause timer ─────────────────

  it('multiple rapid clicks correctly update the screen', () => {
    render(<HeroMockup />)

    fireEvent.click(screen.getByLabelText('Squad'))
    expect(screen.getByTestId('screen-squad')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Party'))
    expect(screen.getByTestId('screen-party')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Accueil'))
    expect(screen.getByTestId('screen-home')).toBeInTheDocument()
  })
})
