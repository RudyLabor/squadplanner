import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimatedAvatar } from '../AnimatedAvatar'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { whileHover, whileTap, transition, initial, animate, exit, layout, layoutId, ...rest } = props
        return <div {...rest}>{children}</div>
      },
      circle: (props: any) => <circle {...props} />,
    },
  }
})

describe('AnimatedAvatar', () => {
  it('renders with image when src is provided', () => {
    render(<AnimatedAvatar src="https://example.com/avatar.png" alt="John Doe" />)
    const img = screen.getByAltText('John Doe')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('renders initials when no src', () => {
    render(<AnimatedAvatar alt="John Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders single initial for single-word name', () => {
    render(<AnimatedAvatar alt="Admin" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('includes screen-reader text with status', () => {
    render(<AnimatedAvatar alt="John Doe" status="online" />)
    expect(screen.getByText('John Doe (online)')).toBeInTheDocument()
  })

  it('renders status dot when showRing is true', () => {
    const { container } = render(<AnimatedAvatar alt="John" status="online" showRing />)
    const dot = container.querySelector('span[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })

  it('does not render ring svg when offline', () => {
    const { container } = render(<AnimatedAvatar alt="John" status="offline" showRing />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('renders ring svg when status is active', () => {
    const { container } = render(<AnimatedAvatar alt="John" status="online" showRing />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('accepts different sizes', () => {
    const { container: sm } = render(<AnimatedAvatar alt="A" size="sm" />)
    const { container: xl } = render(<AnimatedAvatar alt="A" size="xl" />)
    expect(sm.firstChild).toHaveStyle({ width: '36px' })
    expect(xl.firstChild).toHaveStyle({ width: '70px' })
  })
})
