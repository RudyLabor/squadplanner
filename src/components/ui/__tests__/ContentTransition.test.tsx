import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentTransition } from '../ContentTransition'

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

describe('ContentTransition', () => {
  it('shows skeleton when loading', () => {
    render(
      <ContentTransition isLoading={true} skeleton={<div>Loading...</div>}>
        <div>Content</div>
      </ContentTransition>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('shows children when not loading', () => {
    render(
      <ContentTransition isLoading={false} skeleton={<div>Loading...</div>}>
        <div>Content</div>
      </ContentTransition>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('sets aria-busy when loading', () => {
    const { container } = render(
      <ContentTransition isLoading={true} skeleton={<div>Skel</div>}>
        <div>Content</div>
      </ContentTransition>
    )
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
  })

  it('unsets aria-busy when loaded', () => {
    const { container } = render(
      <ContentTransition isLoading={false} skeleton={<div>Skel</div>}>
        <div>Content</div>
      </ContentTransition>
    )
    expect(container.firstChild).toHaveAttribute('aria-busy', 'false')
  })
})
