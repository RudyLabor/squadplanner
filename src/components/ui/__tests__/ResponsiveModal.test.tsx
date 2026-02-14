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

vi.mock('../Dialog', () => ({
  Dialog: ({ children, open, title }: any) => open ? createElement('div', { role: 'dialog' }, createElement('h2', null, title), children) : null,
}))

vi.mock('../Sheet', () => ({
  Sheet: ({ children, open }: any) => open ? createElement('div', null, children) : null,
}))

import { ResponsiveModal } from '../ResponsiveModal'

describe('ResponsiveModal', () => {
  it('renders without crash when open', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
    render(
      <ResponsiveModal open={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </ResponsiveModal>
    )
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <ResponsiveModal open={false} onClose={vi.fn()} title="Test">
        <p>Hidden</p>
      </ResponsiveModal>
    )
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })
})
