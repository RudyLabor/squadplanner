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
  Input: ({ label, ...props }: any) =>
    createElement(
      'div',
      {},
      label ? createElement('label', {}, label) : null,
      createElement('input', props)
    ),
}))

import { OnboardingStepJoinSquad } from '../OnboardingStepJoinSquad'

describe('OnboardingStepJoinSquad', () => {
  const slideVariants = { enter: {}, center: {}, exit: {} }

  const defaultProps = {
    slideVariants,
    inviteCode: '',
    error: null,
    isLoading: false,
    onInviteCodeChange: vi.fn(),
    onJoinSquad: vi.fn(),
    onBack: vi.fn(),
  }

  it('renders without crashing', () => {
    const { container } = render(<OnboardingStepJoinSquad {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('renders title', () => {
    render(<OnboardingStepJoinSquad {...defaultProps} />)
    expect(screen.getByText('Rejoins une squad')).toBeTruthy()
  })

  it('renders invite code input label', () => {
    render(<OnboardingStepJoinSquad {...defaultProps} />)
    expect(screen.getByText("Code d'invitation")).toBeTruthy()
  })

  it('renders error when provided', () => {
    render(<OnboardingStepJoinSquad {...defaultProps} error="Code invalide" />)
    expect(screen.getByText('Code invalide')).toBeTruthy()
  })

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn()
    render(<OnboardingStepJoinSquad {...defaultProps} onBack={onBack} />)
    screen.getByText('Retour').click()
    expect(onBack).toHaveBeenCalled()
  })
})
