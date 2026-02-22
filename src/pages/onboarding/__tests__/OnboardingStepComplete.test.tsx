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
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

import { OnboardingStepComplete } from '../OnboardingStepComplete'

describe('OnboardingStepComplete', () => {
  const defaultProps = {
    createdSquadId: null,
    createdSquadName: null,
    createdSquadCode: null,
    squadGame: '',
    squadsLength: 0,
    firstSquadName: undefined,
    onComplete: vi.fn(),
  }

  it('renders without crashing', () => {
    const { container } = render(<OnboardingStepComplete {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('shows default title when no squad created', () => {
    render(<OnboardingStepComplete {...defaultProps} />)
    expect(screen.getByText("C'est parti !")).toBeTruthy()
  })

  it('shows squad name in title when squad was created', () => {
    render(<OnboardingStepComplete {...defaultProps} createdSquadName="Ma Squad" />)
    expect(screen.getByText('Ma Squad est prête !')).toBeTruthy()
  })

  it('shows invite code when squad was created', () => {
    render(
      <OnboardingStepComplete
        {...defaultProps}
        createdSquadId="id-1"
        createdSquadName="Ma Squad"
        createdSquadCode="ABC123"
      />
    )
    expect(screen.getByText('ABC123')).toBeTruthy()
  })

  it('calls onComplete when button clicked', () => {
    const onComplete = vi.fn()
    render(<OnboardingStepComplete {...defaultProps} onComplete={onComplete} />)
    screen.getByText('Explorer').click()
    expect(onComplete).toHaveBeenCalled()
  })
})
