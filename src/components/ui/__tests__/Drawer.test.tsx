import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Drawer } from '../Drawer'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useDragControls: () => ({ start: vi.fn() }),
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const {
          initial,
          animate,
          exit,
          transition,
          drag,
          dragControls,
          dragConstraints,
          dragElastic,
          onDragEnd,
          whileHover,
          whileTap,
          ...rest
        } = props
        return <div {...rest}>{children}</div>
      },
    },
    m: {
      ...actual.m,
      div: ({ children, ...props }: any) => {
        const {
          initial,
          animate,
          exit,
          transition,
          drag,
          dragControls,
          dragConstraints,
          dragElastic,
          onDragEnd,
          whileHover,
          whileTap,
          ...rest
        } = props
        return <div {...rest}>{children}</div>
      },
    },
  }
})

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null }),
}))

describe('Drawer', () => {
  it('renders when open', () => {
    render(
      <Drawer isOpen onClose={() => {}}>
        <div>Drawer content</div>
      </Drawer>
    )
    expect(screen.getByText('Drawer content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Drawer isOpen={false} onClose={() => {}}>
        <div>Drawer content</div>
      </Drawer>
    )
    expect(screen.queryByText('Drawer content')).not.toBeInTheDocument()
  })

  it('has role=dialog', () => {
    render(
      <Drawer isOpen onClose={() => {}}>
        <div>Content</div>
      </Drawer>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has aria-modal=true', () => {
    render(
      <Drawer isOpen onClose={() => {}}>
        <div>Content</div>
      </Drawer>
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('renders title', () => {
    render(
      <Drawer isOpen onClose={() => {}} title="My Drawer">
        <div>Content</div>
      </Drawer>
    )
    expect(screen.getByText('My Drawer')).toBeInTheDocument()
  })

  it('renders close button when title is present', () => {
    render(
      <Drawer isOpen onClose={() => {}} title="Drawer">
        <div>Content</div>
      </Drawer>
    )
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Drawer isOpen onClose={onClose} title="Drawer">
        <div>Content</div>
      </Drawer>
    )
    await user.click(screen.getByLabelText('Fermer'))
    expect(onClose).toHaveBeenCalled()
  })

  it('sets aria-label from title', () => {
    render(
      <Drawer isOpen onClose={() => {}} title="Filters">
        <div>Content</div>
      </Drawer>
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Filters')
  })
})
