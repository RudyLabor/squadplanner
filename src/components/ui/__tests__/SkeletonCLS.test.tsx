import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  SkeletonAICoach,
  SkeletonReliabilityBadge,
  SkeletonFriendsPlaying,
  SkeletonStatsRow,
  SkeletonStreakCounter,
} from '../skeleton/SkeletonCLS'

describe('SkeletonCLS', () => {
  describe('SkeletonAICoach', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonAICoach />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('has min-height of 72px', () => {
      const { container } = render(<SkeletonAICoach />)
      const el = container.querySelector('.min-h-\\[72px\\]')
      expect(el).toBeTruthy()
    })
  })

  describe('SkeletonReliabilityBadge', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonReliabilityBadge />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('has min-height of 40px', () => {
      const { container } = render(<SkeletonReliabilityBadge />)
      const el = container.querySelector('.min-h-\\[40px\\]')
      expect(el).toBeTruthy()
    })
  })

  describe('SkeletonFriendsPlaying', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonFriendsPlaying />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('has min-height of 180px', () => {
      const { container } = render(<SkeletonFriendsPlaying />)
      const el = container.querySelector('.min-h-\\[180px\\]')
      expect(el).toBeTruthy()
    })

    it('renders 3 friend card skeletons', () => {
      const { container } = render(<SkeletonFriendsPlaying />)
      const cards = container.querySelectorAll('.flex-shrink-0')
      expect(cards.length).toBe(3)
    })
  })

  describe('SkeletonStatsRow', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonStatsRow />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('renders 3 stat items in a grid', () => {
      const { container } = render(<SkeletonStatsRow />)
      const grid = container.querySelector('.grid-cols-3')
      expect(grid).toBeTruthy()
    })
  })

  describe('SkeletonStreakCounter', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonStreakCounter />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('has min-height of 200px', () => {
      const { container } = render(<SkeletonStreakCounter />)
      const el = container.querySelector('.min-h-\\[200px\\]')
      expect(el).toBeTruthy()
    })

    it('renders 7 day slots', () => {
      const { container } = render(<SkeletonStreakCounter />)
      const daySlots = container.querySelectorAll('.w-8.h-8')
      expect(daySlots.length).toBe(7)
    })
  })
})
