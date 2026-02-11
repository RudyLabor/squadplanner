import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimatedList, AnimatedListItem } from '../AnimatedList'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, layout, ...rest } = props
        return <div {...rest}>{children}</div>
      },
    },
    m: {
      ...actual.m,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, layout, ...rest } = props
        return <div {...rest}>{children}</div>
      },
    },
  }
})

describe('AnimatedList', () => {
  it('renders children', () => {
    render(
      <AnimatedList>
        <AnimatedListItem>Item 1</AnimatedListItem>
        <AnimatedListItem>Item 2</AnimatedListItem>
      </AnimatedList>
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('applies className to wrapper', () => {
    const { container } = render(
      <AnimatedList className="my-list">
        <AnimatedListItem>Item</AnimatedListItem>
      </AnimatedList>
    )
    expect(container.firstChild).toHaveClass('my-list')
  })

  it('applies className to list item', () => {
    render(
      <AnimatedList>
        <AnimatedListItem className="my-item">Item</AnimatedListItem>
      </AnimatedList>
    )
    expect(screen.getByText('Item').closest('div')).toHaveClass('my-item')
  })
})
