import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorState } from '../ErrorState'
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

describe('ErrorState', () => {
  it('renders with default error type', () => {
    render(<ErrorState />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(<ErrorState title="Custom Error" />)
    expect(screen.getByText('Custom Error')).toBeInTheDocument()
  })

  it('renders message', () => {
    render(<ErrorState message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorState onRetry={() => {}} />)
    expect(screen.getByText('Réessayer')).toBeInTheDocument()
  })

  it('calls onRetry when button clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    await user.click(screen.getByText('Réessayer'))
    expect(onRetry).toHaveBeenCalled()
  })

  it('shows countdown in retry text', () => {
    render(<ErrorState onRetry={() => {}} retryCountdown={5} />)
    expect(screen.getByText('Réessayer dans 5s')).toBeInTheDocument()
  })

  it('shows custom retry label', () => {
    render(<ErrorState onRetry={() => {}} retryLabel="Try again" />)
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('disables retry button when retrying', () => {
    render(<ErrorState onRetry={() => {}} isRetrying />)
    expect(screen.getByText('Réessayer').closest('button')).toBeDisabled()
  })

  it('renders page variant by default', () => {
    const { container } = render(<ErrorState />)
    expect(container.querySelector('.py-10')).toBeInTheDocument()
  })

  it('renders inline variant', () => {
    const { container } = render(<ErrorState variant="inline" />)
    expect(container.querySelector('.p-3')).toBeInTheDocument()
  })

  it('renders banner variant', () => {
    render(<ErrorState variant="banner" />)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })

  it('renders goBack and goHome buttons on page variant', () => {
    render(<ErrorState onGoBack={() => {}} onGoHome={() => {}} />)
    expect(screen.getByText('Retour')).toBeInTheDocument()
    expect(screen.getByText('Accueil')).toBeInTheDocument()
  })

  it('renders dismiss button on banner variant', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<ErrorState variant="banner" onDismiss={onDismiss} />)
    await user.click(screen.getByLabelText('Fermer'))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('renders warning type', () => {
    render(<ErrorState type="warning" />)
    expect(screen.getByText('Attention')).toBeInTheDocument()
  })

  it('renders network type', () => {
    render(<ErrorState type="network" />)
    expect(screen.getByText('Erreur réseau')).toBeInTheDocument()
  })

  it('renders not-found type', () => {
    render(<ErrorState type="not-found" />)
    expect(screen.getByText('Introuvable')).toBeInTheDocument()
  })
})
