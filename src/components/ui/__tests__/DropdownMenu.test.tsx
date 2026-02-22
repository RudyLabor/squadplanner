import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../DropdownMenu'

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

describe('DropdownMenu', () => {
  it('renders trigger', () => {
    render(
      <DropdownMenu trigger={<button>Open menu</button>}>
        <DropdownMenuItem onSelect={() => {}}>Item</DropdownMenuItem>
      </DropdownMenu>
    )
    expect(screen.getByText('Open menu')).toBeInTheDocument()
  })

  it('has aria-haspopup on trigger wrapper', () => {
    render(
      <DropdownMenu trigger={<button>Open</button>}>
        <DropdownMenuItem onSelect={() => {}}>Item</DropdownMenuItem>
      </DropdownMenu>
    )
    expect(screen.getByText('Open').closest('[aria-haspopup]')).toHaveAttribute(
      'aria-haspopup',
      'menu'
    )
  })

  it('opens menu on click', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu trigger={<button>Open</button>}>
        <DropdownMenuItem onSelect={() => {}}>Edit</DropdownMenuItem>
      </DropdownMenu>
    )
    await user.click(screen.getByText('Open'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('renders menu items with role=menuitem', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu trigger={<button>Open</button>}>
        <DropdownMenuItem onSelect={() => {}}>Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => {}}>Delete</DropdownMenuItem>
      </DropdownMenu>
    )
    await user.click(screen.getByText('Open'))
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  })
})

describe('DropdownMenuSeparator', () => {
  it('renders with role=separator', () => {
    render(<DropdownMenuSeparator />)
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })
})

describe('DropdownMenuLabel', () => {
  it('renders label text', () => {
    render(<DropdownMenuLabel>Actions</DropdownMenuLabel>)
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })
})
