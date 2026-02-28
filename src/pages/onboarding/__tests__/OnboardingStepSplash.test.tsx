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
  '../../../components/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t: any, p: string) =>
          typeof p === 'string'
            ? ({ children, ...props }: any) => createElement('span', props, children)
            : undefined,
      }
    )
)

vi.mock('../../../components/ui', () => ({
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))

vi.mock('../../../components/SquadPlannerLogo', () => ({
  SquadPlannerIcon: () => createElement('span', { 'data-testid': 'logo-icon' }),
}))

import { OnboardingStepSplash } from '../OnboardingStepSplash'

describe('OnboardingStepSplash', () => {
  const slideVariants = { enter: {}, center: {}, exit: {} }

  const defaultProps = {
    slideVariants,
    isNavigating: false,
    onStart: vi.fn(),
    onSkip: vi.fn(),
  }

  it('renders without crashing', () => {
    const { container } = render(<OnboardingStepSplash {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('renders value proposition text', () => {
    render(<OnboardingStepSplash {...defaultProps} />)
    expect(screen.getByText(/on verra/)).toBeTruthy()
  })

  it('renders start button', () => {
    render(<OnboardingStepSplash {...defaultProps} />)
    expect(screen.getByText("C'est parti")).toBeTruthy()
  })

  it('renders skip button', () => {
    render(<OnboardingStepSplash {...defaultProps} />)
    expect(screen.getByText("Passer pour l'instant")).toBeTruthy()
  })

  it('calls onStart when start button clicked', () => {
    const onStart = vi.fn()
    render(<OnboardingStepSplash {...defaultProps} onStart={onStart} />)
    screen.getByText("C'est parti").click()
    expect(onStart).toHaveBeenCalled()
  })
})
