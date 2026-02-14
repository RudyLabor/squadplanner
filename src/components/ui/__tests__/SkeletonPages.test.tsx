import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  SkeletonSessionCard,
  SessionCardSkeleton,
  SkeletonSquadCard,
  SquadCardSkeleton,
  SkeletonMessageBubble,
  SkeletonProfile,
  ProfileSkeleton,
  SkeletonSquadDetail,
  SquadDetailSkeleton,
  SkeletonHomePage,
  SkeletonChatPage,
  SkeletonSettingsPage,
} from '../skeleton/SkeletonPages'

describe('SkeletonPages', () => {
  describe('SkeletonSessionCard', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonSessionCard />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('has backwards compatibility alias', () => {
      expect(SessionCardSkeleton).toBe(SkeletonSessionCard)
    })
  })

  describe('SkeletonSquadCard', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonSquadCard />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('has backwards compatibility alias', () => {
      expect(SquadCardSkeleton).toBe(SkeletonSquadCard)
    })
  })

  describe('SkeletonMessageBubble', () => {
    it('renders message bubble skeleton', () => {
      const { container } = render(<SkeletonMessageBubble />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('renders in own message style when isOwn is true', () => {
      const { container } = render(<SkeletonMessageBubble isOwn={true} />)
      expect(container.querySelector('.flex-row-reverse')).toBeTruthy()
    })

    it('renders avatar for non-own messages', () => {
      const { container } = render(<SkeletonMessageBubble isOwn={false} />)
      const avatars = container.querySelectorAll('.rounded-full')
      expect(avatars.length).toBeGreaterThan(0)
    })
  })

  describe('SkeletonProfile', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonProfile />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('has backwards compatibility alias', () => {
      expect(ProfileSkeleton).toBe(SkeletonProfile)
    })
  })

  describe('SkeletonSquadDetail', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonSquadDetail />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('has backwards compatibility alias', () => {
      expect(SquadDetailSkeleton).toBe(SkeletonSquadDetail)
    })
  })

  describe('SkeletonHomePage', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonHomePage />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })
  })

  describe('SkeletonChatPage', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonChatPage />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('renders messages and input area', () => {
      const { container } = render(<SkeletonChatPage />)
      const borders = container.querySelectorAll('.border-b, .border-t')
      expect(borders.length).toBeGreaterThan(0)
    })
  })

  describe('SkeletonSettingsPage', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonSettingsPage />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    })

    it('renders multiple settings sections', () => {
      const { container } = render(<SkeletonSettingsPage />)
      const sections = container.querySelectorAll('.divide-y')
      expect(sections.length).toBeGreaterThan(0)
    })
  })
})
