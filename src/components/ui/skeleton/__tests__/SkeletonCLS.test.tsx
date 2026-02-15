import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import {
  SkeletonAICoach,
  SkeletonReliabilityBadge,
  SkeletonFriendsPlaying,
  SkeletonStatsRow,
  SkeletonStreakCounter,
} from '../SkeletonCLS'

describe('SkeletonCLS', () => {
  it('SkeletonAICoach renders without crash', () => {
    const { container } = render(<SkeletonAICoach />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonReliabilityBadge renders without crash', () => {
    const { container } = render(<SkeletonReliabilityBadge />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonFriendsPlaying renders without crash', () => {
    const { container } = render(<SkeletonFriendsPlaying />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonStatsRow renders 3 stat items', () => {
    const { container } = render(<SkeletonStatsRow />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonStreakCounter renders without crash', () => {
    const { container } = render(<SkeletonStreakCounter />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
