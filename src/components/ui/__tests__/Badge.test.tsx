import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Badge } from '../Badge'
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

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders count when provided', () => {
    render(<Badge count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('caps count at max', () => {
    render(<Badge count={150} max={99} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('has aria-label with notification count', () => {
    render(<Badge count={3} />)
    expect(screen.getByLabelText('3 notifications')).toBeInTheDocument()
  })

  it('uses singular form for count of 1', () => {
    render(<Badge count={1} />)
    expect(screen.getByLabelText('1 notification')).toBeInTheDocument()
  })

  it('renders dot indicator', () => {
    const { container } = render(
      <Badge variant="success" dot>
        Active
      </Badge>
    )
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })

  it('renders close button when closable', () => {
    render(<Badge closable>Tag</Badge>)
    expect(screen.getByLabelText('Remove')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Badge closable onClose={onClose}>
        Tag
      </Badge>
    )
    await user.click(screen.getByLabelText('Remove'))
    expect(onClose).toHaveBeenCalled()
  })

  it('applies variant styling to wrapper', () => {
    const { container } = render(<Badge variant="error">Error</Badge>)
    // Error variant includes error-themed styling in the className
    expect((container.firstChild as HTMLElement).className).toContain('text-error')
  })

  it('applies size styling to wrapper', () => {
    const { container: smContainer } = render(<Badge size="sm">Small</Badge>)
    const { container: lgContainer } = render(<Badge size="lg">Large</Badge>)
    // Different size props produce different className strings
    expect((smContainer.firstChild as HTMLElement).className).not.toBe(
      (lgContainer.firstChild as HTMLElement).className
    )
  })
})
