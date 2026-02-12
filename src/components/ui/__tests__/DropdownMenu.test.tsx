import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../DropdownMenu'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, ...rest } = props
        return <div {...rest}>{children}</div>
      },
    },
    m: {
      ...actual.m,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, ...rest } = props
        return <div {...rest}>{children}</div>
      },
    },
  }
})

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
