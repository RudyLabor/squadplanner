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

vi.mock('../AnimatedDemo', () => ({
  AnimatedDemo: ({ currentStep, onStepChange }: any) =>
    createElement(
      'div',
      { 'data-testid': 'animated-demo', 'data-step': currentStep },
      'AnimatedDemo'
    ),
  demoSteps: [
    { id: 'create', color: 'var(--color-success)', duration: 3000 },
    { id: 'invite', color: 'var(--color-primary)', duration: 2500 },
    { id: 'rsvp', color: 'var(--color-gold)', duration: 2500 },
    { id: 'play', color: 'var(--color-purple)', duration: 3000 },
  ],
}))

import { HowItWorksSection } from '../HowItWorksSection'

describe('HowItWorksSection', () => {
  const defaultProps = { demoStep: 0, setDemoStep: vi.fn() }

  // ─── Basic rendering ────────────────────────────────────

  it('renders section with id "how-it-works"', () => {
    const { container } = render(<HowItWorksSection {...defaultProps} />)
    expect(container.querySelector('#how-it-works')).toBeTruthy()
  })

  it('renders section with correct aria-label', () => {
    render(<HowItWorksSection {...defaultProps} />)
    expect(screen.getByLabelText('Comment ça marche')).toBeInTheDocument()
  })

  it('renders heading text', () => {
    render(<HowItWorksSection {...defaultProps} />)
    expect(screen.getByText('Comment ça marche')).toBeInTheDocument()
  })

  it('renders subtitle text', () => {
    render(<HowItWorksSection {...defaultProps} />)
    expect(
      screen.getByText('De la création de squad à la session de jeu en 30 secondes')
    ).toBeInTheDocument()
  })

  it('renders AnimatedDemo component', () => {
    render(<HowItWorksSection {...defaultProps} />)
    expect(screen.getByTestId('animated-demo')).toBeInTheDocument()
  })

  it('passes currentStep to AnimatedDemo', () => {
    render(<HowItWorksSection demoStep={2} setDemoStep={vi.fn()} />)
    expect(screen.getByTestId('animated-demo').getAttribute('data-step')).toBe('2')
  })

  // ─── All 4 steps rendered ──────────────────────────────

  it('renders all 4 step titles', () => {
    render(<HowItWorksSection {...defaultProps} />)
    expect(screen.getByText('Crée ta Squad')).toBeInTheDocument()
    expect(screen.getByText('Invite tes potes')).toBeInTheDocument()
    expect(screen.getByText('Planifie, décide, confirme')).toBeInTheDocument()
    expect(screen.getByText('Jouez chaque semaine')).toBeInTheDocument()
  })

  it('renders step icons (Users, MessageCircle, Calendar, Target)', () => {
    render(<HowItWorksSection {...defaultProps} />)
    // Each icon appears in the stepper (desktop) + step details = multiple times
    expect(screen.getAllByTestId('icon-Users').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTestId('icon-MessageCircle').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTestId('icon-Calendar').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTestId('icon-Target').length).toBeGreaterThanOrEqual(1)
  })

  // ─── Active step description (only shown for active) ───

  it('shows description only for active step (demoStep=0)', () => {
    render(<HowItWorksSection {...defaultProps} />)
    expect(screen.getByText(/Donne un nom, choisis ton jeu/)).toBeInTheDocument()
    // Other step descriptions should NOT be visible
    expect(screen.queryByText(/Partage le code/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Propose un créneau/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Check-in, jouez, répétez/)).not.toBeInTheDocument()
  })

  it('shows description for step 1 when demoStep=1', () => {
    render(<HowItWorksSection demoStep={1} setDemoStep={vi.fn()} />)
    expect(screen.getByText(/Partage le code/)).toBeInTheDocument()
    expect(screen.queryByText(/Donne un nom, choisis ton jeu/)).not.toBeInTheDocument()
  })

  it('shows description for step 2 when demoStep=2', () => {
    render(<HowItWorksSection demoStep={2} setDemoStep={vi.fn()} />)
    expect(screen.getByText(/Propose un créneau/)).toBeInTheDocument()
  })

  it('shows description for step 3 when demoStep=3', () => {
    render(<HowItWorksSection demoStep={3} setDemoStep={vi.fn()} />)
    expect(screen.getByText(/Check-in, jouez, répétez/)).toBeInTheDocument()
  })

  // ─── Step clicks call setDemoStep ──────────────────────

  it('clicking a step title calls setDemoStep', () => {
    const setDemoStep = vi.fn()
    render(<HowItWorksSection demoStep={0} setDemoStep={setDemoStep} />)

    // The step detail buttons contain the step titles
    // "Invite tes potes" is step 1 - click its button
    const buttons = screen.getAllByRole('button')
    // Find the button for step 2 (index 1 in detail list)
    const step2Button = buttons.find((btn) => btn.textContent?.includes('Invite tes potes'))
    expect(step2Button).toBeTruthy()
    fireEvent.click(step2Button!)

    expect(setDemoStep).toHaveBeenCalledWith(1)
  })

  it('clicking step 3 calls setDemoStep(2)', () => {
    const setDemoStep = vi.fn()
    render(<HowItWorksSection demoStep={0} setDemoStep={setDemoStep} />)

    const buttons = screen.getAllByRole('button')
    const step3Button = buttons.find((btn) =>
      btn.textContent?.includes('Planifie, décide, confirme')
    )
    fireEvent.click(step3Button!)

    expect(setDemoStep).toHaveBeenCalledWith(2)
  })

  it('clicking step 4 calls setDemoStep(3)', () => {
    const setDemoStep = vi.fn()
    render(<HowItWorksSection demoStep={0} setDemoStep={setDemoStep} />)

    const buttons = screen.getAllByRole('button')
    const step4Button = buttons.find((btn) => btn.textContent?.includes('Jouez chaque semaine'))
    fireEvent.click(step4Button!)

    expect(setDemoStep).toHaveBeenCalledWith(3)
  })

  // ─── Desktop stepper (buttons at top) ──────────────────

  it('renders desktop stepper buttons for each step', () => {
    render(<HowItWorksSection {...defaultProps} />)
    // Desktop stepper has 4 button elements + 4 detail button elements = 8 total
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(8) // 4 stepper + 4 detail
  })

  // ─── Active step styling ───────────────────────────────

  it('active step detail has bg-bg-elevated class', () => {
    render(<HowItWorksSection demoStep={0} setDemoStep={vi.fn()} />)
    // The first step button in the detail area should be active
    const buttons = screen.getAllByRole('button')
    const activeDetailBtn = buttons.find(
      (btn) =>
        btn.textContent?.includes('Crée ta Squad') && btn.className.includes('bg-bg-elevated')
    )
    expect(activeDetailBtn).toBeTruthy()
  })

  it('inactive step details have lg:hidden class', () => {
    render(<HowItWorksSection demoStep={0} setDemoStep={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    const inactiveBtn = buttons.find(
      (btn) => btn.textContent?.includes('Invite tes potes') && btn.className.includes('lg:hidden')
    )
    expect(inactiveBtn).toBeTruthy()
  })

  // ─── Stepper progress line width ───────────────────────

  it('renders progress line with width based on demoStep', () => {
    const { container } = render(<HowItWorksSection demoStep={2} setDemoStep={vi.fn()} />)
    const progressLine = container.querySelector('.stepper-line')
    // Width = (2/3) * 90 = 60%
    expect(progressLine?.getAttribute('style')).toContain('60%')
  })

  it('renders progress line at 0% for step 0', () => {
    const { container } = render(<HowItWorksSection demoStep={0} setDemoStep={vi.fn()} />)
    const progressLine = container.querySelector('.stepper-line')
    expect(progressLine?.getAttribute('style')).toContain('0%')
  })

  it('renders progress line at 90% for last step', () => {
    const { container } = render(<HowItWorksSection demoStep={3} setDemoStep={vi.fn()} />)
    const progressLine = container.querySelector('.stepper-line')
    expect(progressLine?.getAttribute('style')).toContain('90%')
  })

  // ─── Desktop stepper: active vs past vs future styling ─

  it('active stepper button has primary text-white class', () => {
    render(<HowItWorksSection demoStep={1} setDemoStep={vi.fn()} />)
    // The stepper icon container for step index 1 should have bg-primary text-white
    const buttons = screen.getAllByRole('button')
    // Desktop stepper buttons are the first 4
    const stepperBtns = buttons.slice(0, 4)
    // Step 1 (index 1) should be active
    const activeCircle = stepperBtns[1].querySelector('.bg-primary-bg.text-white')
    expect(activeCircle).toBeTruthy()
  })

  it('past stepper button has primary/20 styling', () => {
    render(<HowItWorksSection demoStep={2} setDemoStep={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    const stepperBtns = buttons.slice(0, 4)
    // Steps 0 and 1 are past (isPast)
    const pastCircle = stepperBtns[0].querySelector('.text-primary')
    expect(pastCircle).toBeTruthy()
  })

  // ─── Step icon color from demoSteps ────────────────────

  it('step icon uses color from demoSteps config', () => {
    render(<HowItWorksSection demoStep={0} setDemoStep={vi.fn()} />)
    // The active step detail icon should have color from demoSteps[0].color
    const userIcons = screen.getAllByTestId('icon-Users')
    const detailIcon = userIcons.find((el) => el.style.color === 'var(--color-success)')
    expect(detailIcon).toBeTruthy()
  })

  // ─── Active step title has primary text color ──────────

  it('active step title has text-text-primary class', () => {
    render(<HowItWorksSection demoStep={0} setDemoStep={vi.fn()} />)
    // Find h3 elements - the active one should have text-text-primary
    const headings = screen.getAllByRole('heading', { level: 3 })
    const activeH3 = headings.find(
      (h) => h.textContent === 'Crée ta Squad' && h.className.includes('text-text-primary')
    )
    expect(activeH3).toBeTruthy()
  })

  it('inactive step title has text-text-tertiary class', () => {
    render(<HowItWorksSection demoStep={0} setDemoStep={vi.fn()} />)
    const headings = screen.getAllByRole('heading', { level: 3 })
    const inactiveH3 = headings.find(
      (h) => h.textContent === 'Invite tes potes' && h.className.includes('text-text-tertiary')
    )
    expect(inactiveH3).toBeTruthy()
  })
})
