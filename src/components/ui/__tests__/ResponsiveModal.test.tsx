import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

vi.mock('../Dialog', () => ({
  Dialog: ({ children, open, title, description, size }: any) =>
    open
      ? createElement(
          'div',
          { role: 'dialog', 'data-testid': 'desktop-dialog', 'data-size': size },
          title ? createElement('h2', null, title) : null,
          description
            ? createElement('p', { 'data-testid': 'dialog-description' }, description)
            : null,
          children
        )
      : null,
}))

vi.mock('../Sheet', () => ({
  Sheet: ({ children, open, title, description, side, snapPoints }: any) =>
    open
      ? createElement(
          'div',
          {
            'data-testid': 'mobile-sheet',
            'data-side': side,
            'data-snaps': JSON.stringify(snapPoints),
          },
          title ? createElement('h2', null, title) : null,
          description
            ? createElement('p', { 'data-testid': 'sheet-description' }, description)
            : null,
          children
        )
      : null,
}))

import { ResponsiveModal } from '../ResponsiveModal'

describe('ResponsiveModal', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true })
    window.dispatchEvent(new Event('resize'))
  })

  // STRICT: desktop renders Dialog (not Sheet), with title, description, children, correct size, dialog role
  it('renders Dialog on desktop with all props passed correctly', () => {
    const onClose = vi.fn()
    render(
      <ResponsiveModal
        open={true}
        onClose={onClose}
        title="Edit Profile"
        description="Change your settings"
        size="lg"
      >
        <p>Form content here</p>
      </ResponsiveModal>
    )

    // Dialog rendered, not Sheet
    expect(screen.getByTestId('desktop-dialog')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-sheet')).not.toBeInTheDocument()

    // Title, description, children
    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    expect(screen.getByText('Change your settings')).toBeInTheDocument()
    expect(screen.getByText('Form content here')).toBeInTheDocument()

    // Dialog role present
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Size prop passed
    expect(screen.getByTestId('desktop-dialog')).toHaveAttribute('data-size', 'lg')
  })

  // STRICT: mobile renders Sheet (not Dialog), with bottom side, correct snap points, title and children
  it('renders Sheet on mobile with bottom side and snap points', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true })
    window.dispatchEvent(new Event('resize'))

    render(
      <ResponsiveModal open={true} onClose={vi.fn()} title="Mobile Title" description="Mobile desc">
        <p>Mobile content</p>
      </ResponsiveModal>
    )

    // Sheet rendered, not Dialog
    expect(screen.getByTestId('mobile-sheet')).toBeInTheDocument()
    expect(screen.queryByTestId('desktop-dialog')).not.toBeInTheDocument()

    // Title, description, children
    expect(screen.getByText('Mobile Title')).toBeInTheDocument()
    expect(screen.getByText('Mobile desc')).toBeInTheDocument()
    expect(screen.getByText('Mobile content')).toBeInTheDocument()

    // Sheet has bottom side
    expect(screen.getByTestId('mobile-sheet')).toHaveAttribute('data-side', 'bottom')

    // Snap points [70, 95]
    expect(screen.getByTestId('mobile-sheet')).toHaveAttribute('data-snaps', '[70,95]')
  })

  // STRICT: closed state renders nothing regardless of viewport
  it('renders nothing when open is false', () => {
    render(
      <ResponsiveModal open={false} onClose={vi.fn()} title="Hidden">
        <p>Should not be visible</p>
      </ResponsiveModal>
    )

    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
    expect(screen.queryByText('Should not be visible')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('desktop-dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mobile-sheet')).not.toBeInTheDocument()
  })

  // STRICT: default size is 'md' when not provided
  it('uses default size md when size prop is omitted', () => {
    render(
      <ResponsiveModal open={true} onClose={vi.fn()} title="Default Size">
        <p>Content</p>
      </ResponsiveModal>
    )

    expect(screen.getByTestId('desktop-dialog')).toHaveAttribute('data-size', 'md')
  })
})
