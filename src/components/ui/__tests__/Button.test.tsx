import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

import { Button } from '../Button'

vi.mock('../../../utils/haptics', () => ({
  haptic: { light: vi.fn(), selection: vi.fn(), medium: vi.fn() },
}))

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('defaults to type=button', () => {
    render(<Button>Btn</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('fires onClick handler', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when isLoading', () => {
    render(<Button isLoading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows aria-busy when loading', () => {
    render(<Button isLoading>Loading</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies danger variant styling', () => {
    const { container } = render(<Button variant="danger">Delete</Button>)
    // Danger variant includes error-themed styling in className
    const btn = container.querySelector('button') as HTMLElement
    expect(btn.className).toContain('text-error')
  })

  it('renders full width when fullWidth prop is set', () => {
    const { container: fullContainer } = render(<Button fullWidth>Full</Button>)
    const { container: normalContainer } = render(<Button>Normal</Button>)
    // fullWidth button has a different className than a normal-width button
    const fullBtn = fullContainer.querySelector('button') as HTMLElement
    const normalBtn = normalContainer.querySelector('button') as HTMLElement
    expect(fullBtn.className).not.toBe(normalBtn.className)
    // fullWidth includes w-full in className
    expect(fullBtn.className).toContain('w-full')
  })

  it('renders left and right icons', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon" />}
        rightIcon={<span data-testid="right-icon" />}
      >
        With Icons
      </Button>
    )
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('renders loading text when provided', () => {
    render(
      <Button isLoading loadingText="Saving...">
        Save
      </Button>
    )
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })
})
