import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from '../Sheet'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useDragControls: () => ({ start: vi.fn() }),
    useMotionValue: () => ({ get: () => 0, set: vi.fn(), onChange: vi.fn() }),
    useTransform: () => ({ get: () => 1 }),
    animate: vi.fn(),
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const {
          initial,
          animate: a,
          exit,
          transition,
          drag,
          dragControls,
          dragConstraints,
          dragElastic,
          onDragEnd,
          style: mStyle,
          ...rest
        } = props
        return (
          <div style={mStyle} {...rest}>
            {children}
          </div>
        )
      },
    },
    m: {
      ...actual.m,
      div: ({ children, ...props }: any) => {
        const {
          initial,
          animate: a,
          exit,
          transition,
          drag,
          dragControls,
          dragConstraints,
          dragElastic,
          onDragEnd,
          style: mStyle,
          ...rest
        } = props
        return (
          <div style={mStyle} {...rest}>
            {children}
          </div>
        )
      },
    },
  }
})

describe('Sheet', () => {
  it('renders when open', () => {
    render(
      <Sheet open onClose={() => {}}>
        <div>Sheet content</div>
      </Sheet>
    )
    expect(screen.getByText('Sheet content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Sheet open={false} onClose={() => {}}>
        <div>Sheet content</div>
      </Sheet>
    )
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument()
  })

  it('has role=dialog', () => {
    render(
      <Sheet open onClose={() => {}}>
        <div>Content</div>
      </Sheet>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has aria-modal=true', () => {
    render(
      <Sheet open onClose={() => {}}>
        <div>Content</div>
      </Sheet>
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('renders title', () => {
    render(
      <Sheet open onClose={() => {}} title="Sheet Title">
        <div>Content</div>
      </Sheet>
    )
    expect(screen.getByText('Sheet Title')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(
      <Sheet open onClose={() => {}} title="Title" description="Description text">
        <div>Content</div>
      </Sheet>
    )
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(
      <Sheet open onClose={() => {}} title="Title">
        <div>Content</div>
      </Sheet>
    )
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Sheet open onClose={onClose} title="Title">
        <div>Content</div>
      </Sheet>
    )
    await user.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalled()
  })
})
