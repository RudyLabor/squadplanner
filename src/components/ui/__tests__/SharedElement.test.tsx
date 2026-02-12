import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SharedElement } from '../SharedElement'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { layoutId, layout, transition, ...rest } = props
        return <div {...rest}>{children}</div>
      },
    },
    m: {
      ...actual.m,
      div: ({ children, ...props }: any) => {
        const { layoutId, layout, transition, ...rest } = props
        return <div {...rest}>{children}</div>
      },
    },
  }
})

describe('SharedElement', () => {
  it('renders children', () => {
    render(<SharedElement id="hero">Content</SharedElement>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('is aria-hidden', () => {
    const { container } = render(<SharedElement id="hero">Content</SharedElement>)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies className', () => {
    const { container } = render(
      <SharedElement id="hero" className="custom">
        Content
      </SharedElement>
    )
    expect(container.firstChild).toHaveClass('custom')
  })
})
