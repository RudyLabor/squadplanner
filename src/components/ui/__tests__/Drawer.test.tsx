import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Drawer } from '../Drawer'
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
  useDragControls: vi.fn().mockReturnValue({ start: vi.fn() }),
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
