import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvatarGroup } from '../AvatarGroup'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
        return <div {...rest}>{children}</div>
      },
      button: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
        return <button {...rest}>{children}</button>
      },
    },
  }
})

const avatars = [
  { name: 'Alice', src: 'https://example.com/alice.png', status: 'online' as const },
  { name: 'Bob', status: 'offline' as const },
  { name: 'Charlie', status: 'away' as const },
  { name: 'Diana' },
  { name: 'Eve' },
  { name: 'Frank' },
]

describe('AvatarGroup', () => {
  it('renders visible avatars up to max', () => {
    render(<AvatarGroup avatars={avatars} max={3} />)
    expect(screen.getByTitle('Alice')).toBeInTheDocument()
    expect(screen.getByTitle('Bob')).toBeInTheDocument()
    expect(screen.getByTitle('Charlie')).toBeInTheDocument()
    expect(screen.queryByTitle('Diana')).not.toBeInTheDocument()
  })

  it('shows overflow count button', () => {
    render(<AvatarGroup avatars={avatars} max={3} />)
    expect(screen.getByText('+3')).toBeInTheDocument()
  })

  it('shows correct aria-label on overflow button', () => {
    render(<AvatarGroup avatars={avatars} max={3} />)
    expect(screen.getByLabelText('3 more members')).toBeInTheDocument()
  })

  it('calls onOverflowClick when overflow button is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<AvatarGroup avatars={avatars} max={3} onOverflowClick={onClick} />)
    await user.click(screen.getByText('+3'))
    expect(onClick).toHaveBeenCalled()
  })

  it('does not show overflow when all avatars fit', () => {
    render(<AvatarGroup avatars={avatars.slice(0, 3)} max={5} />)
    expect(screen.queryByLabelText(/more members/)).not.toBeInTheDocument()
  })

  it('renders group role with member count', () => {
    render(<AvatarGroup avatars={avatars} />)
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', '6 members')
  })

  it('renders screen-reader text listing members', () => {
    render(<AvatarGroup avatars={avatars} max={3} />)
    expect(screen.getByText(/Alice, Bob, Charlie and 3 more/)).toBeInTheDocument()
  })

  it('renders images for avatars with src', () => {
    render(<AvatarGroup avatars={avatars} max={3} />)
    expect(screen.getByAltText('Alice')).toHaveAttribute('src', 'https://example.com/alice.png')
  })

  it('renders initials for avatars without src', () => {
    render(<AvatarGroup avatars={[{ name: 'Bob' }]} max={5} />)
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('applies different sizes', () => {
    const { container } = render(<AvatarGroup avatars={avatars.slice(0, 2)} size="lg" />)
    const avatarDivs = container.querySelectorAll('.w-11')
    expect(avatarDivs.length).toBeGreaterThan(0)
  })
})
