import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingMore } from '../LoadingMore'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
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

describe('LoadingMore', () => {
  it('renders default text', () => {
    render(<LoadingMore />)
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it('renders custom text', () => {
    render(<LoadingMore text="Loading more items..." />)
    expect(screen.getByText('Loading more items...')).toBeInTheDocument()
  })

  it('renders spinner icon', () => {
    const { container } = render(<LoadingMore />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
