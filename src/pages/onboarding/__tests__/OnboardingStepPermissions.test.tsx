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
}))

import { OnboardingStepPermissions } from '../OnboardingStepPermissions'

describe('OnboardingStepPermissions', () => {
  const slideVariants = { enter: {}, center: {}, exit: {} }

  const defaultProps = {
    slideVariants,
    notifPermission: 'default' as const,
    micPermission: 'prompt' as const,
    isNavigating: false,
    onRequestNotifications: vi.fn(),
    onRequestMic: vi.fn(),
    onSkipMic: vi.fn(),
    canProceed: false,
    onComplete: vi.fn(),
    onBack: vi.fn(),
  }

  it('renders without crashing', () => {
    const { container } = render(<OnboardingStepPermissions {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('renders title', () => {
    render(<OnboardingStepPermissions {...defaultProps} />)
    expect(screen.getByText('Ne rate jamais une session')).toBeTruthy()
  })

  it('renders notification section', () => {
    render(<OnboardingStepPermissions {...defaultProps} />)
    expect(screen.getByText('Notifications')).toBeTruthy()
  })

  it('renders microphone section', () => {
    render(<OnboardingStepPermissions {...defaultProps} />)
    expect(screen.getByText('Microphone')).toBeTruthy()
  })

  it('shows granted state for notifications', () => {
    render(<OnboardingStepPermissions {...defaultProps} notifPermission="granted" />)
    expect(screen.getByText(/Activées/)).toBeTruthy()
  })

  it('shows granted state for microphone', () => {
    render(<OnboardingStepPermissions {...defaultProps} micPermission="granted" />)
    expect(screen.getByText(/Autorisé/)).toBeTruthy()
  })
})
