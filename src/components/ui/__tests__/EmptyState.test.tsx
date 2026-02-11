import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { EmptyState } from '../EmptyState'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  const createMockComponent = (tag: string) => {
    const Component = ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, ...rest } = props
      const Tag = tag as any
      return <Tag {...rest}>{children}</Tag>
    }
    Component.displayName = `motion.${tag}`
    return Component
  }
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => children,
    motion: {
      ...actual.motion,
      div: createMockComponent('div'),
      button: createMockComponent('button'),
      span: createMockComponent('span'),
    },
    m: {
      ...actual.m,
      div: createMockComponent('div'),
      button: createMockComponent('button'),
      span: createMockComponent('span'),
    },
  }
})

vi.mock('../../../utils/haptics', () => ({
  haptic: { light: vi.fn() },
}))

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState icon={<span>icon</span>} title="No items" />, { wrapper: MemoryRouter })
    expect(screen.getByText('No items')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<EmptyState icon={<span>icon</span>} title="No items" description="Create your first item" />, { wrapper: MemoryRouter })
    expect(screen.getByText('Create your first item')).toBeInTheDocument()
  })

  it('renders icon', () => {
    render(<EmptyState icon={<span data-testid="icon">icon</span>} title="Empty" />, { wrapper: MemoryRouter })
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('has aria-live polite', () => {
    const { container } = render(<EmptyState icon={<span>icon</span>} title="Empty" />, { wrapper: MemoryRouter })
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
  })

  it('renders action button with onClick', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <EmptyState icon={<span>icon</span>} title="Empty" actionLabel="Create" onAction={onAction} />,
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
      <EmptyState icon={<span>icon</span>} title="Empty" secondaryActionLabel="Cancel" onSecondaryAction={onSecondary} />,
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
