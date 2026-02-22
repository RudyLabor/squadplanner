import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const getGameImageUrlMock = vi.fn().mockReturnValue('/images/valorant.jpg')
const getGameGradientMock = vi
  .fn()
  .mockReturnValue('linear-gradient(to bottom right, #ff4655, #0f1923)')
const getGameInitialMock = vi.fn().mockReturnValue('V')
const hasGameImageMock = vi.fn().mockReturnValue(true)

vi.mock('../../../utils/gameImages', () => ({
  getGameImageUrl: (...args: any[]) => getGameImageUrlMock(...args),
  getGameGradient: (...args: any[]) => getGameGradientMock(...args),
  getGameInitial: (...args: any[]) => getGameInitialMock(...args),
  hasGameImage: (...args: any[]) => hasGameImageMock(...args),
}))

import { GameCover, GameCoverCompact, GameCoverLarge } from '../GameCover'

describe('GameCover', () => {
  // STRICT: renders image with correct alt, src, lazy loading, hover overlay with game name
  it('renders complete game cover with image, alt text, lazy loading, and hover overlay', () => {
    const { container } = render(<GameCover gameName="Valorant" size="md" />)

    // Image rendered with correct attributes
    const img = screen.getByAltText('Valorant cover')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/images/valorant.jpg')
    expect(img).toHaveAttribute('loading', 'lazy')

    // Hover overlay contains game name
    expect(screen.getByText('Valorant')).toBeInTheDocument()

    // Container is a block-level wrapper element
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.tagName).toBe('DIV')
    // Wrapper should exist and contain the image
    expect(wrapper).toContainElement(img)
  })

  // STRICT: fallback renders gradient + initial letter when no image, no img tag, correct initial
  it('renders gradient fallback with initial when no image available', () => {
    hasGameImageMock.mockReturnValue(false)
    getGameInitialMock.mockReturnValue('A')
    getGameGradientMock.mockReturnValue('linear-gradient(to br, #00ff00, #0000ff)')

    const { container } = render(<GameCover gameName="Apex Legends" />)

    // No img tag when no image
    expect(screen.queryByRole('img')).not.toBeInTheDocument()

    // Initial letter shown
    expect(screen.getByText('A')).toBeInTheDocument()

    // Gradient applied as background
    expect(container.firstChild).toHaveStyle({
      background: 'linear-gradient(to br, #00ff00, #0000ff)',
    })

    // Hover overlay still shows game name
    expect(screen.getByText('Apex Legends')).toBeInTheDocument()

    // Restore mocks
    hasGameImageMock.mockReturnValue(true)
    getGameInitialMock.mockReturnValue('V')
  })

  // STRICT: image error triggers fallback to gradient + initial
  it('falls back to gradient on image load error', () => {
    hasGameImageMock.mockReturnValue(true)
    getGameInitialMock.mockReturnValue('F')
    getGameGradientMock.mockReturnValue('linear-gradient(to br, orange, purple)')

    render(<GameCover gameName="Fortnite" />)

    const img = screen.getByAltText('Fortnite cover')
    expect(img).toBeInTheDocument()

    // Simulate image error
    fireEvent.error(img)

    // After error, should show initial (image hidden via hasImage becoming false)
    expect(screen.getByText('F')).toBeInTheDocument()

    // Game name still in overlay
    expect(screen.getByText('Fortnite')).toBeInTheDocument()
  })

  // STRICT: size variants - sm, md, lg produce different rendered wrappers
  it('renders different sizes for sm, md, and lg variants', () => {
    // Small — renders without error, produces a wrapper
    const { container: smContainer } = render(<GameCover gameName="V" size="sm" />)
    const smWrapper = smContainer.firstChild as HTMLElement
    expect(smWrapper).toBeInTheDocument()

    // Medium (default) — renders without error
    const { container: mdContainer } = render(<GameCover gameName="V" size="md" />)
    const mdWrapper = mdContainer.firstChild as HTMLElement
    expect(mdWrapper).toBeInTheDocument()

    // Large — renders without error
    const { container: lgContainer } = render(<GameCover gameName="V" size="lg" />)
    const lgWrapper = lgContainer.firstChild as HTMLElement
    expect(lgWrapper).toBeInTheDocument()

    // Each size variant should produce a distinct className (different size tokens)
    expect(smWrapper.className).not.toBe(mdWrapper.className)
    expect(mdWrapper.className).not.toBe(lgWrapper.className)
  })

  // STRICT: GameCoverCompact renders with sm size, GameCoverLarge renders with lg size
  it('GameCoverCompact uses sm size and GameCoverLarge uses lg size', () => {
    const { container: compactContainer } = render(<GameCoverCompact gameName="LoL" />)
    // Compact variant renders image with correct alt
    expect(screen.getByAltText('LoL cover')).toBeInTheDocument()
    // Compact wrapper exists
    expect(compactContainer.firstChild).toBeInTheDocument()

    const { container: largeContainer } = render(<GameCoverLarge gameName="Dota" />)
    // Large variant renders image with correct alt
    expect(screen.getByAltText('Dota cover')).toBeInTheDocument()
    // Large wrapper exists and has different dimensions from compact
    expect(largeContainer.firstChild).toBeInTheDocument()
    expect((largeContainer.firstChild as HTMLElement).className).not.toBe(
      (compactContainer.firstChild as HTMLElement).className
    )
  })

  // STRICT: custom className is forwarded to the wrapper element
  it('applies custom className alongside default classes', () => {
    const { container } = render(<GameCover gameName="V" className="my-custom-class" />)
    const wrapper = container.firstChild as HTMLElement
    // Custom class is included in the wrapper's className string
    expect(wrapper.className).toContain('my-custom-class')
  })

  // STRICT: image starts hidden and becomes visible after load event
  it('transitions image from hidden to visible on load', () => {
    render(<GameCover gameName="Valorant" />)

    const img = screen.getByAltText('Valorant cover')
    // Initially not loaded — image should not be visually displayed (opacity is 0)
    expect(img.className).toContain('opacity-0')
    expect(img.className).not.toContain('opacity-100')

    // Simulate load
    fireEvent.load(img)

    // After load — image should now be visually displayed (opacity is 100)
    expect(img.className).toContain('opacity-100')
    expect(img.className).not.toContain('opacity-0')
  })
})
