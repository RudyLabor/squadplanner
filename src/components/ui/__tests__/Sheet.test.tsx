import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from '../Sheet'
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
