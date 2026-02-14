import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { CallToast } from '../CallToast'

// Mock framer-motion
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

// Mock icons
vi.mock('../../icons', () => ({
  CheckCircle2: (props: any) => createElement('svg', { 'data-testid': 'icon-check', ...props }),
  AlertCircle: (props: any) => createElement('svg', { 'data-testid': 'icon-alert', ...props }),
}))

describe('CallToast', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <CallToast message="Test message" isVisible={true} />
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('displays the message when visible', () => {
    render(<CallToast message="Connexion rétablie !" isVisible={true} />)
    expect(screen.getByText('Connexion rétablie !')).toBeInTheDocument()
  })

  it('does not show message when not visible', () => {
    render(<CallToast message="Hidden message" isVisible={false} />)
    expect(screen.queryByText('Hidden message')).not.toBeInTheDocument()
  })

  it('shows check icon for success variant', () => {
    render(<CallToast message="Success!" isVisible={true} variant="success" />)
    expect(screen.getByTestId('icon-check')).toBeInTheDocument()
  })

  it('shows alert icon for error variant', () => {
    render(<CallToast message="Error!" isVisible={true} variant="error" />)
    expect(screen.getByTestId('icon-alert')).toBeInTheDocument()
  })

  it('defaults to success variant', () => {
    render(<CallToast message="Default" isVisible={true} />)
    expect(screen.getByTestId('icon-check')).toBeInTheDocument()
  })

  it('applies success background class for success variant', () => {
    const { container } = render(
      <CallToast message="Success" isVisible={true} variant="success" />
    )
    const toast = container.querySelector('.bg-success')
    expect(toast).toBeInTheDocument()
  })

  it('applies error background class for error variant', () => {
    const { container } = render(
      <CallToast message="Error" isVisible={true} variant="error" />
    )
    const toast = container.querySelector('.bg-error')
    expect(toast).toBeInTheDocument()
  })
})
