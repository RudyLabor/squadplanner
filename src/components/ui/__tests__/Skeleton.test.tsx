import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonWrapper,
  SkeletonSessionCard,
  SkeletonSquadCard,
} from '../Skeleton'

describe('Skeleton', () => {
  it('renders with aria-hidden', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('forwards className to element', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('h-4')
    expect(el.className).toContain('w-32')
  })

  it('applies width and height styles', () => {
    const { container } = render(<Skeleton width={100} height={20} />)
    expect(container.firstChild).toHaveStyle({ width: '100px', height: '20px' })
  })

  it('applies string width and height', () => {
    const { container } = render(<Skeleton width="50%" height="2rem" />)
    expect(container.firstChild).toHaveStyle({ width: '50%', height: '2rem' })
  })

  it('applies rounded prop to element', () => {
    const { container: fullContainer } = render(<Skeleton rounded="full" />)
    const { container: defaultContainer } = render(<Skeleton />)
    // rounded="full" produces a different border-radius token than default
    const fullEl = fullContainer.firstChild as HTMLElement
    const defaultEl = defaultContainer.firstChild as HTMLElement
    expect(fullEl.className).not.toBe(defaultEl.className)
    expect(fullEl.className).toContain('rounded-full')
  })
})

describe('SkeletonText', () => {
  it('renders correct number of lines', () => {
    const { container } = render(<SkeletonText lines={4} />)
    const skeletons = container.querySelectorAll('[aria-hidden="true"]')
    expect(skeletons).toHaveLength(4)
  })

  it('defaults to 3 lines', () => {
    const { container } = render(<SkeletonText />)
    const skeletons = container.querySelectorAll('[aria-hidden="true"]')
    expect(skeletons).toHaveLength(3)
  })
})

describe('SkeletonAvatar', () => {
  it('renders with rounded-full', () => {
    const { container } = render(<SkeletonAvatar />)
    expect(container.querySelector('.rounded-full')).toBeInTheDocument()
  })

  it('applies size', () => {
    const { container } = render(<SkeletonAvatar size="xl" />)
    expect(container.querySelector('.w-16')).toBeInTheDocument()
  })
})

describe('SkeletonButton', () => {
  it('renders with rounded-lg', () => {
    const { container } = render(<SkeletonButton />)
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
  })
})

describe('SkeletonCard', () => {
  it('renders with aria-hidden', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders custom children', () => {
    render(
      <SkeletonCard>
        <div>Custom</div>
      </SkeletonCard>
    )
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })
})

describe('SkeletonWrapper', () => {
  it('shows skeleton when loading', () => {
    render(
      <SkeletonWrapper isLoading skeleton={<div>Loading...</div>}>
        <div>Content</div>
      </SkeletonWrapper>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('shows children when not loading', () => {
    render(
      <SkeletonWrapper isLoading={false} skeleton={<div>Loading...</div>}>
        <div>Content</div>
      </SkeletonWrapper>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })
})

describe('SkeletonSessionCard', () => {
  it('renders with aria-hidden', () => {
    const { container } = render(<SkeletonSessionCard />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('SkeletonSquadCard', () => {
  it('renders with aria-hidden', () => {
    const { container } = render(<SkeletonSquadCard />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
