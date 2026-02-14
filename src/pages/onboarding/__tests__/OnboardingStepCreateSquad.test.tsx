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

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Button: ({ children, ...props }: any) => createElement('button', props, children),
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  Input: ({ label, ...props }: any) => createElement('div', {}, label ? createElement('label', {}, label) : null, createElement('input', props)),
}))

import { OnboardingStepCreateSquad } from '../OnboardingStepCreateSquad'

describe('OnboardingStepCreateSquad', () => {
  const slideVariants = { enter: {}, center: {}, exit: {} }

  const defaultProps = {
    slideVariants,
    squadName: '',
    squadGame: '',
    error: null,
    isLoading: false,
    onSquadNameChange: vi.fn(),
    onSquadGameChange: vi.fn(),
    onCreateSquad: vi.fn(),
    onBack: vi.fn(),
  }

  it('renders without crashing', () => {
    const { container } = render(<OnboardingStepCreateSquad {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('renders back button', () => {
    render(<OnboardingStepCreateSquad {...defaultProps} />)
    expect(screen.getByText('Retour')).toBeTruthy()
  })

  it('renders input labels', () => {
    render(<OnboardingStepCreateSquad {...defaultProps} />)
    expect(screen.getByText('Nom de la squad')).toBeTruthy()
    expect(screen.getByText('Jeu principal')).toBeTruthy()
  })

  it('renders error when provided', () => {
    render(<OnboardingStepCreateSquad {...defaultProps} error="Une erreur" />)
    expect(screen.getByText('Une erreur')).toBeTruthy()
  })

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn()
    render(<OnboardingStepCreateSquad {...defaultProps} onBack={onBack} />)
    screen.getByText('Retour').click()
    expect(onBack).toHaveBeenCalled()
  })
})
