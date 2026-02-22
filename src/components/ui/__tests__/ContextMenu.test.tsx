import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextMenu, type ContextMenuItem } from '../ContextMenu'
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

const items: ContextMenuItem[] = [
  { id: 'edit', label: 'Edit', onClick: vi.fn() },
  { id: 'sep', label: '', separator: true, onClick: vi.fn() },
  { id: 'delete', label: 'Delete', danger: true, onClick: vi.fn() },
  { id: 'disabled', label: 'Disabled', disabled: true, onClick: vi.fn() },
]

describe('ContextMenu', () => {
  it('renders children', () => {
    render(
      <ContextMenu items={items}>
        <div>Right click me</div>
      </ContextMenu>
    )
    expect(screen.getByText('Right click me')).toBeInTheDocument()
  })

  it('opens on contextmenu event', () => {
    render(
      <ContextMenu items={items}>
        <div>Target</div>
      </ContextMenu>
    )
    fireEvent.contextMenu(screen.getByText('Target'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('shows menu items when open', () => {
    render(
      <ContextMenu items={items}>
        <div>Target</div>
      </ContextMenu>
    )
    fireEvent.contextMenu(screen.getByText('Target'))
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('renders separator', () => {
    render(
      <ContextMenu items={items}>
        <div>Target</div>
      </ContextMenu>
    )
    fireEvent.contextMenu(screen.getByText('Target'))
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('renders disabled items', () => {
    render(
      <ContextMenu items={items}>
        <div>Target</div>
      </ContextMenu>
    )
    fireEvent.contextMenu(screen.getByText('Target'))
    const disabledItem = screen.getByText('Disabled').closest('button')
    expect(disabledItem).toBeDisabled()
  })

  it('does not open when disabled', () => {
    render(
      <ContextMenu items={items} disabled>
        <div>Target</div>
      </ContextMenu>
    )
    fireEvent.contextMenu(screen.getByText('Target'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('menu items have role=menuitem', () => {
    render(
      <ContextMenu items={items}>
        <div>Target</div>
      </ContextMenu>
    )
    fireEvent.contextMenu(screen.getByText('Target'))
    expect(screen.getAllByRole('menuitem').length).toBeGreaterThan(0)
  })
})
