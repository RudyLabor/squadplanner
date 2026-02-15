import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import {
  SkeletonSessionCard,
  SkeletonSquadCard,
  SkeletonMessageBubble,
  SkeletonProfile,
  SkeletonSquadDetail,
  SkeletonHomePage,
  SkeletonChatPage,
  SkeletonSettingsPage,
} from '../SkeletonPages'

describe('SkeletonPages', () => {
  it('SkeletonSessionCard renders', () => {
    const { container } = render(<SkeletonSessionCard />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonSquadCard renders', () => {
    const { container } = render(<SkeletonSquadCard />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonMessageBubble renders', () => {
    const { container } = render(<SkeletonMessageBubble />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonMessageBubble renders own variant', () => {
    const { container } = render(<SkeletonMessageBubble isOwn />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonProfile renders', () => {
    const { container } = render(<SkeletonProfile />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonSquadDetail renders', () => {
    const { container } = render(<SkeletonSquadDetail />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonHomePage renders', () => {
    const { container } = render(<SkeletonHomePage />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonChatPage renders', () => {
    const { container } = render(<SkeletonChatPage />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('SkeletonSettingsPage renders', () => {
    const { container } = render(<SkeletonSettingsPage />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
