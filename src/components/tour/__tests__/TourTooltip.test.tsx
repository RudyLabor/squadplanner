import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { TourTooltip } from '../TourTooltip'

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
        get: (_t, name) =>
          typeof name === 'string'
            ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
            : undefined,
      }
    )
)

const MockIcon = (props: any) => createElement('svg', { 'data-testid': 'tour-icon', ...props })

describe('TourTooltip', () => {
  const baseProps = {
    currentStep: 0,
    totalSteps: 5,
    title: 'Welcome',
    description: 'This is step one',
    icon: MockIcon,
    tooltipPos: { top: 100, left: 200 },
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onSkip: vi.fn(),
  }

  it('renders title and description', () => {
    render(<TourTooltip {...baseProps} />)
    expect(screen.getByText('Welcome')).toBeDefined()
    expect(screen.getByText('This is step one')).toBeDefined()
  })

  it('renders step counter', () => {
    render(<TourTooltip {...baseProps} />)
    expect(screen.getByText('1 / 5')).toBeDefined()
  })

  it('renders "Suivant" button on non-last step', () => {
    render(<TourTooltip {...baseProps} />)
    expect(screen.getByText('Suivant')).toBeDefined()
  })

  it('renders "C\'est parti !" on last step', () => {
    render(<TourTooltip {...baseProps} currentStep={4} />)
    expect(screen.getByText("C'est parti !")).toBeDefined()
  })

  it('renders "Passer" skip button', () => {
    render(<TourTooltip {...baseProps} />)
    expect(screen.getByText('Passer')).toBeDefined()
  })

  it('does not render prev button on first step', () => {
    render(<TourTooltip {...baseProps} currentStep={0} />)
    expect(screen.queryByTestId('icon-ArrowLeft')).toBeNull()
  })

  it('renders prev button on non-first step', () => {
    render(<TourTooltip {...baseProps} currentStep={2} />)
    expect(screen.getByTestId('icon-ArrowLeft')).toBeDefined()
  })

  it('calls onNext when next button is clicked', () => {
    const onNext = vi.fn()
    render(<TourTooltip {...baseProps} onNext={onNext} />)
    fireEvent.click(screen.getByText('Suivant'))
    expect(onNext).toHaveBeenCalled()
  })

  it('calls onSkip when "Passer" is clicked', () => {
    const onSkip = vi.fn()
    render(<TourTooltip {...baseProps} onSkip={onSkip} />)
    fireEvent.click(screen.getByText('Passer'))
    expect(onSkip).toHaveBeenCalled()
  })

  it('renders progress dots', () => {
    const { container } = render(<TourTooltip {...baseProps} />)
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots.length).toBeGreaterThanOrEqual(5)
  })
})
