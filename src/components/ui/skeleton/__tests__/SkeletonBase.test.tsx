import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonWrapper,
} from '../SkeletonBase'

describe('SkeletonBase', () => {
  it('Skeleton renders without crash', () => {
    const { container } = render(<Skeleton className="test" />)
    expect(container.firstChild).toHaveClass('test')
  })

  it('SkeletonText renders correct number of lines', () => {
    const { container } = render(<SkeletonText lines={4} />)
    const skeletons = container.querySelectorAll('[aria-hidden="true"]')
    expect(skeletons.length).toBe(4)
  })

  it('SkeletonAvatar renders', () => {
    const { container } = render(<SkeletonAvatar size="lg" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('SkeletonButton renders', () => {
    const { container } = render(<SkeletonButton size="md" width="full" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('SkeletonCard renders default content', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonWrapper shows skeleton when loading', () => {
    render(
      <SkeletonWrapper isLoading={true} skeleton={<div>Loading</div>}>
        <div>Content</div>
      </SkeletonWrapper>
    )
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('SkeletonWrapper shows content when not loading', () => {
    render(
      <SkeletonWrapper isLoading={false} skeleton={<div>Loading</div>}>
        <div>Content</div>
      </SkeletonWrapper>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
