import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Badge } from '../Badge'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAnimate: () => [{ current: null }, vi.fn()],
    motion: {
      ...actual.motion,
      span: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
        return <span {...rest}>{children}</span>
      },
    },
  }
})

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
    const { container } = render(<Badge variant="success" dot>Active</Badge>)
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
    render(<Badge closable onClose={onClose}>Tag</Badge>)
    await user.click(screen.getByLabelText('Remove'))
    expect(onClose).toHaveBeenCalled()
  })

  it('applies variant classes', () => {
    const { container } = render(<Badge variant="error">Error</Badge>)
    expect(container.firstChild).toHaveClass('text-error')
  })

  it('applies size classes', () => {
    const { container } = render(<Badge size="lg">Large</Badge>)
    expect(container.firstChild).toHaveClass('text-sm')
  })
})
