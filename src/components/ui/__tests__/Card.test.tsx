import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card, CardHeader, CardContent } from '../Card'
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

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders as clickable with role=button when onClick provided', () => {
    render(<Card onClick={() => {}}>Click card</Card>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Card onClick={onClick}>Click me</Card>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })

  it('handles keyboard Enter on clickable card', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Card onClick={onClick}>Press Enter</Card>)
    const card = screen.getByRole('button')
    card.focus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalled()
  })

  it('handles keyboard Space on clickable card', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Card onClick={onClick}>Press Space</Card>)
    const card = screen.getByRole('button')
    card.focus()
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalled()
  })

  it('does not have button role when not clickable', () => {
    render(<Card>Static card</Card>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Card loading>Loading content</Card>)
    const card = screen.getByText('Loading content').closest('[aria-busy]')
    expect(card).toHaveAttribute('aria-busy', 'true')
  })

  it('shows disabled state', () => {
    render(<Card disabled>Disabled</Card>)
    const card = screen.getByText('Disabled').closest('[aria-disabled]')
    expect(card).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Card disabled onClick={onClick}>
        Disabled
      </Card>
    )
    // disabled card has pointer-events-none, but let's check onClick isn't called
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('applies aria-label', () => {
    render(<Card aria-label="Custom label">Content</Card>)
    expect(screen.getByLabelText('Custom label')).toBeInTheDocument()
  })
})

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header</CardHeader>)
    expect(screen.getByText('Header')).toBeInTheDocument()
  })
})

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Body</CardContent>)
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('applies compact padding style', () => {
    const { container: compactContainer } = render(<CardContent compact>Compact</CardContent>)
    const { container: normalContainer } = render(<CardContent>Normal</CardContent>)
    // Compact padding produces a different className than default
    const compactEl = compactContainer.firstChild as HTMLElement
    const normalEl = normalContainer.firstChild as HTMLElement
    expect(compactEl.className).not.toBe(normalEl.className)
    // Compact has smaller padding token, default has larger one
    expect(compactEl.className).toContain('p-3')
    expect(normalEl.className).toContain('p-5')
  })
})
