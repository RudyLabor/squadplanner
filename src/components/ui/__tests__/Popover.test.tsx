import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Popover } from '../Popover'
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

describe('Popover', () => {
  it('renders trigger', () => {
    render(
      <Popover trigger={<button>Open</button>}>
        <div>Popover content</div>
      </Popover>
    )
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('has aria-haspopup on trigger', () => {
    render(
      <Popover trigger={<button>Open</button>}>
        <div>Content</div>
      </Popover>
    )
    expect(screen.getByText('Open').closest('[aria-haspopup]')).toHaveAttribute(
      'aria-haspopup',
      'true'
    )
  })

  it('opens on click', async () => {
    const user = userEvent.setup()
    render(
      <Popover trigger={<button>Open</button>}>
        <div>Popover content</div>
      </Popover>
    )
    await user.click(screen.getByText('Open'))
    expect(screen.getByText('Popover content')).toBeInTheDocument()
  })

  it('sets aria-expanded when open', async () => {
    const user = userEvent.setup()
    render(
      <Popover trigger={<button>Open</button>}>
        <div>Content</div>
      </Popover>
    )
    const wrapper = screen.getByText('Open').closest('[aria-expanded]')!
    expect(wrapper).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByText('Open'))
    expect(wrapper).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders as dialog role', async () => {
    const user = userEvent.setup()
    render(
      <Popover trigger={<button>Open</button>}>
        <div>Content</div>
      </Popover>
    )
    await user.click(screen.getByText('Open'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('supports controlled open state', () => {
    render(
      <Popover trigger={<button>Open</button>} open={true}>
        <div>Controlled content</div>
      </Popover>
    )
    expect(screen.getByText('Controlled content')).toBeInTheDocument()
  })
})
