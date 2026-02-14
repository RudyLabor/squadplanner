import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../Dialog'
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
