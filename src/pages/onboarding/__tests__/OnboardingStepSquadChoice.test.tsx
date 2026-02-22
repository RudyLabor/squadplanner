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

import { OnboardingStepSquadChoice } from '../OnboardingStepSquadChoice'

describe('OnboardingStepSquadChoice', () => {
  const slideVariants = { enter: {}, center: {}, exit: {} }

  const defaultProps = {
    slideVariants,
    isNavigating: false,
    onCreateSquad: vi.fn(),
    onJoinSquad: vi.fn(),
  }

  it('renders without crashing', () => {
    const { container } = render(<OnboardingStepSquadChoice {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('renders create squad option', () => {
    render(<OnboardingStepSquadChoice {...defaultProps} />)
    expect(screen.getByText(/Créer une squad/)).toBeTruthy()
  })

  it('renders join squad option', () => {
    render(<OnboardingStepSquadChoice {...defaultProps} />)
    expect(screen.getByText('Rejoindre une squad')).toBeTruthy()
  })

  it('calls onCreateSquad when create button clicked', () => {
    const onCreateSquad = vi.fn()
    render(<OnboardingStepSquadChoice {...defaultProps} onCreateSquad={onCreateSquad} />)
    screen.getByTestId('create-squad-button').click()
    expect(onCreateSquad).toHaveBeenCalled()
  })

  it('calls onJoinSquad when join button clicked', () => {
    const onJoinSquad = vi.fn()
    render(<OnboardingStepSquadChoice {...defaultProps} onJoinSquad={onJoinSquad} />)
    screen.getByTestId('join-squad-button').click()
    expect(onJoinSquad).toHaveBeenCalled()
  })
})
