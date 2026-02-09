import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  const { forwardRef, createElement } = await import('react')
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => children,
    motion: {
      ...actual.motion,
      button: forwardRef(({ children, whileHover, whileTap, transition, initial, animate, exit, ...rest }: any, ref: any) => {
        return createElement('button', { ...rest, ref }, children)
      }),
      span: ({ children, initial, animate, exit, transition, ...rest }: any) => {
        return createElement('span', rest, children)
      },
      div: ({ children, whileHover, whileTap, transition, initial, animate, exit, ...rest }: any) => {
        return createElement('div', rest, children)
      },
    },
  }
})

import { Button } from '../Button'

vi.mock('../../../utils/haptics', () => ({
  haptic: { light: vi.fn(), selection: vi.fn(), medium: vi.fn() },
}))

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('defaults to type=button', () => {
    render(<Button>Btn</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('fires onClick handler', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when isLoading', () => {
    render(<Button isLoading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows aria-busy when loading', () => {
    render(<Button isLoading>Loading</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Delete</Button>)
    expect(container.querySelector('button')).toHaveClass('text-error')
  })

  it('applies fullWidth class', () => {
    const { container } = render(<Button fullWidth>Full</Button>)
    expect(container.querySelector('button')).toHaveClass('w-full')
  })

  it('renders left and right icons', () => {
    render(
      <Button leftIcon={<span data-testid="left-icon" />} rightIcon={<span data-testid="right-icon" />}>
        With Icons
      </Button>
    )
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('renders loading text when provided', () => {
    render(<Button isLoading loadingText="Saving...">Save</Button>)
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })
})
