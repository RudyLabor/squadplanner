import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../Dialog'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, ...rest } = props
        return <div {...rest}>{children}</div>
      },
    },
  }
})

describe('Dialog', () => {
  it('renders when open', () => {
    render(
      <Dialog open onClose={() => {}}>
        <DialogBody>Dialog content</DialogBody>
      </Dialog>
    )
    expect(screen.getByText('Dialog content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Dialog open={false} onClose={() => {}}>
        <DialogBody>Dialog content</DialogBody>
      </Dialog>
    )
    expect(screen.queryByText('Dialog content')).not.toBeInTheDocument()
  })

  it('has role=dialog and aria-modal', () => {
    render(
      <Dialog open onClose={() => {}}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('renders title with aria-labelledby', () => {
    render(
      <Dialog open onClose={() => {}} title="My Dialog">
        <DialogBody>Content</DialogBody>
      </Dialog>
    )
    expect(screen.getByText('My Dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
  })

  it('renders description with aria-describedby', () => {
    render(
      <Dialog open onClose={() => {}} title="Title" description="Description text">
        <DialogBody>Content</DialogBody>
      </Dialog>
    )
    expect(screen.getByText('Description text')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby')
  })

  it('renders close button by default', () => {
    render(
      <Dialog open onClose={() => {}} title="Title">
        <DialogBody>Content</DialogBody>
      </Dialog>
    )
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose} title="Title">
        <DialogBody>Content</DialogBody>
      </Dialog>
    )
    await user.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('hides close button when showCloseButton=false', () => {
    render(
      <Dialog open onClose={() => {}} showCloseButton={false}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    )
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument()
  })
})

describe('DialogHeader', () => {
  it('renders children', () => {
    render(<DialogHeader>Header</DialogHeader>)
    expect(screen.getByText('Header')).toBeInTheDocument()
  })
})

describe('DialogBody', () => {
  it('renders children', () => {
    render(<DialogBody>Body content</DialogBody>)
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })
})

describe('DialogFooter', () => {
  it('renders children', () => {
    render(<DialogFooter>Footer content</DialogFooter>)
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })
})
