import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { MessageToast } from '../MessageToast'

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
  CheckCircle2: (props: any) => createElement('svg', { ...props, 'data-testid': 'check-icon' }),
  AlertCircle: (props: any) => createElement('svg', { ...props, 'data-testid': 'alert-icon' }),
}))

describe('MessageToast', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MessageToast message="Test" isVisible={true} />
    )
    expect(container).toBeTruthy()
  })

  it('shows message when visible', () => {
    render(<MessageToast message="Message sent!" isVisible={true} />)
    expect(screen.getByText('Message sent!')).toBeInTheDocument()
  })

  it('does not show message when not visible', () => {
    render(<MessageToast message="Message sent!" isVisible={false} />)
    expect(screen.queryByText('Message sent!')).not.toBeInTheDocument()
  })

  it('shows check icon for success variant', () => {
    render(<MessageToast message="Success!" isVisible={true} variant="success" />)
    expect(screen.getByTestId('check-icon')).toBeInTheDocument()
  })

  it('shows alert icon for error variant', () => {
    render(<MessageToast message="Error!" isVisible={true} variant="error" />)
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
  })

  it('defaults to success variant', () => {
    render(<MessageToast message="Default" isVisible={true} />)
    expect(screen.getByTestId('check-icon')).toBeInTheDocument()
  })

  it('applies success styles by default', () => {
    const { container } = render(<MessageToast message="OK" isVisible={true} />)
    const inner = container.querySelector('.bg-success')
    expect(inner).toBeInTheDocument()
  })

  it('applies error styles for error variant', () => {
    const { container } = render(
      <MessageToast message="Fail" isVisible={true} variant="error" />
    )
    const inner = container.querySelector('.bg-error')
    expect(inner).toBeInTheDocument()
  })
})
