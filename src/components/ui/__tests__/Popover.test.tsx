import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Popover } from '../Popover'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, style: mStyle, ...rest } = props
        return <div style={mStyle} {...rest}>{children}</div>
      },
    },
    m: {
      ...actual.m,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, style: mStyle, ...rest } = props
        return <div style={mStyle} {...rest}>{children}</div>
      },
    },
  }
})

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
    expect(screen.getByText('Open').closest('[aria-haspopup]')).toHaveAttribute('aria-haspopup', 'true')
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
