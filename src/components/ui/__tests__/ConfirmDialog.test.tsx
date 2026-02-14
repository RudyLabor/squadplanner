import { describe, it, expect, vi } from 'vitest'
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

vi.mock('../../icons', () => ({
  AlertTriangle: (props: any) => createElement('span', props, 'alert'),
  X: (props: any) => createElement('span', props, 'x'),
}))

vi.mock('../Dialog', () => ({
  Dialog: ({ children, open, title }: any) => open ? createElement('div', { role: 'dialog' }, createElement('h2', null, title), children) : null,
  DialogBody: ({ children }: any) => createElement('div', null, children),
  DialogFooter: ({ children }: any) => createElement('div', null, children),
}))

vi.mock('../Sheet', () => ({
  Sheet: ({ children, open }: any) => open ? createElement('div', null, children) : null,
}))

vi.mock('../Button', () => ({
  Button: ({ children, onClick, ...props }: any) => createElement('button', { onClick, ...props }, children),
}))

import { ConfirmDialog } from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders without crash when open', () => {
    // Force desktop mode (innerWidth >= 1024)
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm Action"
        description="Are you sure?"
      />
    )
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('renders confirm and cancel buttons', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test"
        description="Desc"
        confirmLabel="Yes"
        cancelLabel="No"
      />
    )
    expect(screen.getAllByText('Yes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('No').length).toBeGreaterThan(0)
  })
})
