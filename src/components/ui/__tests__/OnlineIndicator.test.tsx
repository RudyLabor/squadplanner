import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OnlineIndicator, AvatarWithStatus } from '../OnlineIndicator'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      span: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, ...rest } = props
        return <span {...rest}>{children}</span>
      },
    },
  }
})

describe('OnlineIndicator', () => {
  it('renders with role=status', () => {
    render(<OnlineIndicator isOnline={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows online label for screen readers', () => {
    render(<OnlineIndicator isOnline={true} />)
    expect(screen.getByText('En ligne')).toBeInTheDocument()
  })

  it('shows offline label for screen readers', () => {
    render(<OnlineIndicator isOnline={false} />)
    expect(screen.getByText('Hors ligne')).toBeInTheDocument()
  })

  it('has aria-label for online', () => {
    render(<OnlineIndicator isOnline={true} />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'En ligne')
  })

  it('has aria-label for offline', () => {
    render(<OnlineIndicator isOnline={false} />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Hors ligne')
  })

  it('accepts different sizes', () => {
    const { container } = render(<OnlineIndicator isOnline={true} size="lg" />)
    expect(container.querySelector('.w-3')).toBeInTheDocument()
  })

  it('renders inline by default', () => {
    const { container } = render(<OnlineIndicator isOnline={true} />)
    expect(container.querySelector('.inline-block')).toBeInTheDocument()
  })
})

describe('AvatarWithStatus', () => {
  it('renders image when src provided', () => {
    render(<AvatarWithStatus src="avatar.jpg" alt="User" isOnline={true} />)
    expect(screen.getByAltText('User')).toBeInTheDocument()
  })

  it('renders initial when no src', () => {
    render(<AvatarWithStatus alt="Bob" isOnline={false} />)
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('includes online indicator', () => {
    render(<AvatarWithStatus alt="Bob" isOnline={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
