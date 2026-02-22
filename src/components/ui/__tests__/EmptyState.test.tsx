import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { EmptyState } from '../EmptyState'
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

vi.mock('../../../utils/haptics', () => ({
  haptic: { light: vi.fn() },
}))

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState icon={<span>icon</span>} title="No items" />, { wrapper: MemoryRouter })
    expect(screen.getByText('No items')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(
      <EmptyState icon={<span>icon</span>} title="No items" description="Create your first item" />,
      { wrapper: MemoryRouter }
    )
    expect(screen.getByText('Create your first item')).toBeInTheDocument()
  })

  it('renders icon', () => {
    render(<EmptyState icon={<span data-testid="icon">icon</span>} title="Empty" />, {
      wrapper: MemoryRouter,
    })
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('has aria-live polite', () => {
    const { container } = render(<EmptyState icon={<span>icon</span>} title="Empty" />, {
      wrapper: MemoryRouter,
    })
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
  })

  it('renders action button with onClick', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="Empty"
        actionLabel="Create"
        onAction={onAction}
      />,
      { wrapper: MemoryRouter }
    )
    await user.click(screen.getByText('Create'))
    expect(onAction).toHaveBeenCalled()
  })

  it('renders action link with actionTo', () => {
    render(
      <EmptyState icon={<span>icon</span>} title="Empty" actionLabel="Go" actionTo="/create" />,
      { wrapper: MemoryRouter }
    )
    expect(screen.getByText('Go')).toBeInTheDocument()
  })

  it('renders secondary action', async () => {
    const user = userEvent.setup()
    const onSecondary = vi.fn()
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="Empty"
        secondaryActionLabel="Cancel"
        onSecondaryAction={onSecondary}
      />,
      { wrapper: MemoryRouter }
    )
    await user.click(screen.getByText('Cancel'))
    expect(onSecondary).toHaveBeenCalled()
  })

  it('uses compact variant', () => {
    const { container } = render(
      <EmptyState icon={<span>icon</span>} title="Empty" variant="compact" />,
      { wrapper: MemoryRouter }
    )
    expect(container.querySelector('.py-6')).toBeInTheDocument()
  })
})
